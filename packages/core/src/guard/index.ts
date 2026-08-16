import type { NavigationGuard, NavigationGuardNext, NavigationGuardNextOptions, NavigationGuardReturn, NavigationRedirectMode, PostNavigationGuard, RouteConfig, RouteLocation, RouteLocationRaw } from '@/types'
import { RouterErrorCode } from '@/types/error'
import type { NavigationFailure } from '@/types/error'
import { warn } from '@/utils/general'

/**
 * 守卫执行结果，表示导航是被放行、重定向还是中止
 *
 * redirect 时的 mode 表示使用者通过 next(location, { mode }) 指定的重定向方式，
 * 未指定时为 undefined，由路由器沿用原始导航方式。
 */
export type GuardResult = { type: 'next'; redirect?: RouteLocationRaw; mode?: NavigationRedirectMode } | { type: 'abort'; code: RouterErrorCode }

/**
 * 守卫默认超时时间（毫秒）
 *
 * 当守卫函数在此时间内既未调用 next() 也未返回 rejected Promise 时，
 * 将输出警告提示开发者检查守卫逻辑，并自动中止导航以防止永久挂起。
 * 可通过 RouterOptions.guardTimeout 覆盖此默认值。
 */
const DEFAULT_GUARD_TIMEOUT = 10000

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
	// 其他值视为 RouteLocationRaw（string 或对象），重定向
	return { type: 'next', redirect: value as RouteLocationRaw }
}

/**
 * 使用 next 回调模式执行守卫（兼容旧版）
 *
 * 通过函数参数个数检测（guard.length >= 3）判断守卫使用旧版回调模式。
 * 守卫通过调用 `next()` / `next(false)` / `next(location)` 控制导航行为。
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @param timeout - 超时时间（毫秒）
 * @returns 守卫执行结果
 */
function runGuardWithNext(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	return new Promise(resolve => {
		let resolved = false
		let timer: ReturnType<typeof setTimeout> | undefined

		const next: NavigationGuardNext = (location?: RouteLocationRaw | false, options?: NavigationGuardNextOptions) => {
			if (resolved) return
			resolved = true
			if (timer) clearTimeout(timer)

			if (location === false) {
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_ABORTED })
			} else if (location) {
				resolve({ type: 'next', redirect: location, mode: options?.mode })
			} else {
				resolve({ type: 'next' })
			}
		}

		// 超时保护
		if (timeout > 0) {
			timer = setTimeout(() => {
				if (!resolved) {
					resolved = true
					warn(`Navigation guard "${guard.name || 'anonymous'}" timed out after ${timeout / 1000}s. ` + 'Make sure to call next() in your guard function, or migrate to the return-value pattern.')
					resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
				}
			}, timeout)
		}

		try {
			const returnValue = guard(to, from, next) as NavigationGuardReturn | Promise<NavigationGuardReturn>

			// 如果守卫返回了 Promise，处理其 resolve/reject
			if (returnValue && typeof (returnValue as Promise<NavigationGuardReturn>).then === 'function') {
				;(returnValue as Promise<NavigationGuardReturn>)
					.then(resolvedValue => {
						if (!resolved) {
							// next() 未调用但 Promise resolve 了
							// 如果 Promise 有返回值，则按返回值模式处理
							if (resolvedValue !== undefined && resolvedValue !== void 0) {
								warn(`Navigation guard "${guard.name || 'anonymous'}" used both next() callback and Promise return value. Use only one pattern.`)
								resolved = true
								if (timer) clearTimeout(timer)
								resolve(resolveGuardReturn(resolvedValue))
							}
							// 无返回值：自动放行（Promise resolve 视为守卫完成）
						} else {
							// next() 已调用且 Promise 有返回值：混用模式
							if (resolvedValue !== undefined && resolvedValue !== void 0) {
								warn(`Navigation guard "${guard.name || 'anonymous'}" called next() and also returned a value. Use either next() callback or return value, not both.`)
							}
						}
					})
					.catch(() => {
						if (!resolved) {
							resolved = true
							if (timer) clearTimeout(timer)
							resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
						}
					})
			}
		} catch {
			if (!resolved) {
				resolved = true
				if (timer) clearTimeout(timer)
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
			}
		}
	})
}

/**
 * 使用返回值模式执行守卫（推荐，v2.1.0+）
 *
 * 守卫通过返回值控制导航行为：
 * - `undefined` / `true` — 放行
 * - `false` — 中止
 * - `RouteLocationRaw` — 重定向
 * - `Error` — 取消
 * - 抛出异常 — 取消
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @param timeout - 超时时间（毫秒）
 * @returns 守卫执行结果
 */
async function runGuardWithReturn(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	let resolved = false
	let timer: ReturnType<typeof setTimeout> | undefined

	// 超时保护
	const timeoutPromise = new Promise<GuardResult>(resolve => {
		if (timeout > 0) {
			timer = setTimeout(() => {
				if (!resolved) {
					resolved = true
					warn(`Navigation guard "${guard.name || 'anonymous'}" timed out after ${timeout / 1000}s. ` + 'Make sure your guard resolves (returns a value or throws).')
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
 * 执行单个导航守卫，将守卫结果转换为 Promise 形式的 GuardResult
 *
 * 自动检测守卫使用的模式：
 * - 守卫函数参数个数 >= 3：使用 next 回调模式（兼容旧版）
 * - 守卫函数参数个数 < 3：使用返回值模式（推荐）
 *
 * 返回值模式支持的返回类型：
 * - `undefined` / `void` / `true` — 放行导航
 * - `false` — 中止导航（NAVIGATION_ABORTED）
 * - `string` — 重定向到路径（如 `'/login'`）
 * - `RouteLocationRaw` — 重定向到路由位置（如 `{ name: 'login' }`）
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
function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	// 通过函数参数个数检测守卫模式
	// guard.length 返回函数声明的参数个数
	// (to, from, next) => {} → length = 3 → 旧版回调模式
	// (to, from) => {} → length = 2 → 新版返回值模式
	// 使用 ...args 剩余参数时 length = 0 → 按返回值模式处理
	const useNextCallback = guard.length >= 3

	if (useNextCallback) {
		return runGuardWithNext(guard, to, from, timeout)
	}

	return runGuardWithReturn(guard, to, from, timeout)
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

	return {
		beforeEach,
		beforeResolve,
		afterEach,
		runBeforeGuards,
		runBeforeResolveGuards,
		runBeforeEnterGuards,
		runAfterGuards
	}
}
