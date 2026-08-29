import type { NavigationGuard, NavigationGuardReturn, NavigationRedirect, NavigationRedirectMode, PostNavigationGuard, RouteConfig, RouteLocation, RouteLocationRaw, BackGuard } from '@/types'
import { RouterErrorCode } from '@/enums'
import { DEFAULT_GUARD_TIMEOUT } from '@/constants'
import type { NavigationFailure } from '@/types/error'
import { warn } from '@/utils/general'

/**
 * 守卫执行结果，表示导航是被放行、重定向还是中止
 *
 * redirect 时的 mode 表示使用者通过返回值中的 `mode` 字段指定的重定向方式，
 * 未指定时为 undefined，由路由器沿用原始导航方式。
 */
export type GuardResult = { type: 'next'; redirect?: RouteLocationRaw; mode?: NavigationRedirectMode } | { type: 'abort'; code: RouterErrorCode }

/**
 * 守卫管理器接口，提供全局守卫的注册与执行能力
 */
export interface GuardManager {
	/**
	 * 注册全局前置守卫
	 * @param guard - 前置守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeEach(guard: NavigationGuard): () => void

	/**
	 * 注册全局解析守卫
	 * @param guard - 解析守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeResolve(guard: NavigationGuard): () => void

	/**
	 * 注册全局后置钩子
	 * @param guard - 后置钩子函数
	 * @returns 用于移除此钩子的函数
	 */
	afterEach(guard: PostNavigationGuard): () => void

	/**
	 * 依次执行全局前置守卫队列
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @returns 守卫执行结果
	 */
	runBeforeGuards(to: RouteLocation, from: RouteLocation): Promise<GuardResult>

	/**
	 * 依次执行全局解析守卫队列
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @returns 守卫执行结果
	 */
	runBeforeResolveGuards(to: RouteLocation, from: RouteLocation): Promise<GuardResult>

	/**
	 * 执行路由独享的 beforeEnter 守卫
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param route - 路由配置项
	 * @returns 守卫执行结果
	 */
	runBeforeEnterGuards(to: RouteLocation, from: RouteLocation, route: RouteConfig): Promise<GuardResult>

	/**
	 * 依次执行全局后置钩子
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param failure - 导航失败时的错误信息，成功时为空
	 */
	runAfterGuards(to: RouteLocation, from: RouteLocation, failure?: NavigationFailure | null): void

	/**
	 * 注册全局返回守卫
	 *
	 * 在返回操作触发时执行（物理返回键 / 顶部导航栏返回 / navigateBack）。
	 * 返回 `false` 阻止返回，`true` / `undefined` 放行。
	 *
	 * @param guard - 返回守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	onBeforeBack(guard: BackGuard): () => void

	/**
	 * 依次执行全局返回守卫队列
	 * @param to - 返回目标路由（上一页）
	 * @param from - 当前正要离开的路由
	 * @returns 任一守卫返回 false 时返回 false（拦截），全部放行时返回 true
	 */
	runBeforeBackGuards(to: RouteLocation, from: RouteLocation): Promise<boolean>
}

/**
 * 判断守卫返回值是否为可控重定向对象（NavigationRedirect）
 *
 * NavigationRedirect 通过顶层 `location` 字段与 RouteLocationRaw 区分：
 * RouteLocationPathRaw（必须有 path）/ RouteLocationNamedRaw（必须有 name）均不含 `location` 顶层字段。
 */
function isRedirect(value: unknown): value is NavigationRedirect {
	return typeof value === 'object' && value !== null && 'location' in value
}

/**
 * 将守卫返回值转换为 GuardResult
 *
 * @param value - 守卫返回值
 * @returns 对应的 GuardResult
 */
function resolveGuardReturn(value: NavigationGuardReturn): GuardResult {
	if (value === false) {
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_ABORTED }
	}
	if (value instanceof Error) {
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
	}
	if (value === true || value === undefined || value === null || value === void 0) {
		return { type: 'next' }
	}
	// NavigationRedirect：重定向并指定导航方式
	if (isRedirect(value)) {
		return { type: 'next', redirect: value.location, mode: value.mode }
	}
	// 其他值视为 RouteLocationRaw（string 或对象），重定向
	return { type: 'next', redirect: value as RouteLocationRaw }
}

/**
 * 执行单个导航守卫，将守卫结果转换为 Promise 形式的 GuardResult
 *
 * 守卫通过返回值控制导航行为：
 * - `undefined` / `void` / `true` — 放行导航
 * - `false` — 中止导航（NAVIGATION_ABORTED）
 * - `string` — 重定向到路径（如 `'/login'`）
 * - `RouteLocationRaw` — 重定向到路由位置（如 `{ name: 'login' }`）
 * - `NavigationRedirect` — 重定向并指定导航方式（如 `{ location: { name: 'login' }, mode: 'replace' }`）
 * - `Error` — 取消导航（NAVIGATION_CANCELLED）
 * - `null` — 等同于 undefined，放行导航
 * - 抛出异常 — 取消导航
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @param timeout - 超时时间（毫秒），0 表示禁用超时保护
 * @returns 守卫执行结果
 */
async function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	let resolved = false
	let timer: ReturnType<typeof setTimeout> | undefined

	// 超时保护
	const timeoutPromise = new Promise<GuardResult>(resolve => {
		if (timeout > 0) {
			timer = setTimeout(() => {
				if (!resolved) {
					resolved = true
					warn(`Navigation guard "${guard.name || 'anonymous'}" timed out after ${timeout / 1000}s. Make sure your guard resolves (returns a value or throws).`)
					resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
				}
			}, timeout)
		}
	})

	try {
		const returnValue = guard(to, from)

		// 超时与守卫执行竞速
		const result = await Promise.race([
			Promise.resolve(returnValue).then((value): GuardResult => {
				resolved = true
				if (timer) clearTimeout(timer)
				return resolveGuardReturn(value)
			}),
			timeoutPromise
		])

		return result
	} catch {
		if (!resolved) {
			resolved = true
			if (timer) clearTimeout(timer)
			return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
		}
		// 超时已触发，忽略捕获的异常
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
	}
}

/**
 * 依次执行守卫队列，遇到中止或重定向时提前退出
 * @param guards - 守卫函数数组
 * @param to - 目标路由
 * @param from - 来源路由
 * @returns 队列中首个中止或重定向结果，全部通过时返回放行
 */
async function runGuardQueue(guards: NavigationGuard[], to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	for (const guard of guards) {
		const result = await runGuard(guard, to, from, timeout)
		if (result.type === 'abort') return result
		if (result.redirect) return result
	}
	return { type: 'next' }
}

/**
 * 创建守卫管理器实例
 * @param guardTimeout - 守卫超时时间（毫秒），0 表示禁用超时保护
 * @returns 守卫管理器
 */
export function createGuardManager(guardTimeout: number = DEFAULT_GUARD_TIMEOUT): GuardManager {
	const beforeGuards: NavigationGuard[] = []
	const beforeResolveGuards: NavigationGuard[] = []
	const afterGuards: PostNavigationGuard[] = []
	const beforeBackGuards: BackGuard[] = []

	/**
	 * 注册全局前置守卫，在每次导航前执行
	 * @param guard - 前置守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	function beforeEach(guard: NavigationGuard): () => void {
		beforeGuards.push(guard)
		return () => {
			const index = beforeGuards.indexOf(guard)
			if (index > -1) beforeGuards.splice(index, 1)
		}
	}

	/**
	 * 注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行
	 * @param guard - 解析守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	function beforeResolve(guard: NavigationGuard): () => void {
		beforeResolveGuards.push(guard)
		return () => {
			const index = beforeResolveGuards.indexOf(guard)
			if (index > -1) beforeResolveGuards.splice(index, 1)
		}
	}

	/**
	 * 注册全局后置钩子，在导航完成后执行，不影响导航结果
	 * @param guard - 后置钩子函数
	 * @returns 用于移除此钩子的函数
	 */
	function afterEach(guard: PostNavigationGuard): () => void {
		afterGuards.push(guard)
		return () => {
			const index = afterGuards.indexOf(guard)
			if (index > -1) afterGuards.splice(index, 1)
		}
	}

	/**
	 * 执行全局前置守卫队列
	 * @param to - 目标路由
	 * @param from - 来源路由
	 */
	function runBeforeGuards(to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
		return runGuardQueue(beforeGuards, to, from, guardTimeout)
	}

	/**
	 * 执行全局解析守卫队列
	 * @param to - 目标路由
	 * @param from - 来源路由
	 */
	function runBeforeResolveGuards(to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
		return runGuardQueue(beforeResolveGuards, to, from, guardTimeout)
	}

	/**
	 * 执行路由独享的 beforeEnter 守卫
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param route - 路由配置项
	 */
	async function runBeforeEnterGuards(to: RouteLocation, from: RouteLocation, route: RouteConfig): Promise<GuardResult> {
		if (!route.beforeEnter) return { type: 'next' }

		const guards = Array.isArray(route.beforeEnter) ? route.beforeEnter : [route.beforeEnter]

		return runGuardQueue(guards, to, from, guardTimeout)
	}

	/**
	 * 执行全局后置钩子，钩子中的异常不会影响导航
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param failure - 导航失败时的错误信息，成功时为空
	 */
	function runAfterGuards(to: RouteLocation, from: RouteLocation, failure?: NavigationFailure | null): void {
		for (const guard of afterGuards) {
			try {
				guard(to, from, failure)
			} catch {
				// afterEach hooks should not affect navigation
			}
		}
	}

	/**
	 * 注册全局返回守卫
	 * @param guard - 返回守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	function onBeforeBack(guard: BackGuard): () => void {
		beforeBackGuards.push(guard)
		return () => {
			const index = beforeBackGuards.indexOf(guard)
			if (index > -1) beforeBackGuards.splice(index, 1)
		}
	}

	/**
	 * 依次执行全局返回守卫队列，任一守卫返回 false 时拦截
	 * @param to - 返回目标路由（上一页）
	 * @param from - 当前正要离开的路由
	 * @returns 全部放行时返回 true，被拦截时返回 false
	 */
	async function runBeforeBackGuards(to: RouteLocation, from: RouteLocation): Promise<boolean> {
		for (const guard of beforeBackGuards) {
			const result = await Promise.resolve(guard(to, from))
			if (result === false) return false
		}
		return true
	}

	return {
		beforeEach,
		beforeResolve,
		afterEach,
		runBeforeGuards,
		runBeforeResolveGuards,
		runBeforeEnterGuards,
		runAfterGuards,
		onBeforeBack,
		runBeforeBackGuards
	}
}
