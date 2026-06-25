import type { NavigationGuard, NavigationGuardNext, NavigationGuardNextOptions, NavigationRedirectMode, PostNavigationGuard, RouteConfig, RouteLocation, RouteLocationRaw } from '@/types'
import { RouterErrorCode } from '@/types/error'
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
	 */
	runAfterGuards(to: RouteLocation, from: RouteLocation): void
}

/**
 * 执行单个导航守卫，将回调风格的 next 转换为 Promise 形式的 GuardResult
 *
 * 守卫函数可通过以下方式决定导航行为：
 * - 调用 `next()` 放行导航
 * - 调用 `next(false)` 中止导航
 * - 调用 `next(location)` 重定向到新位置
 * - 调用 `next(location, { mode })` 重定向并指定导航方式（push/replace/relaunch）
 * - 抛出异常或返回 rejected Promise 将取消导航
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @returns 守卫执行结果
 */
function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
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

		// 超时保护：守卫未在指定时间内调用 next() 时，输出警告并中止导航
		// timeout 为 0 时禁用超时保护
		if (timeout > 0) {
			timer = setTimeout(() => {
				if (!resolved) {
					resolved = true
					warn(`Navigation guard "${guard.name || 'anonymous'}" did not resolve within ${timeout / 1000}s. ` + 'Make sure to call next() in your guard function.')
					resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
				}
			}, timeout)
		}

		let promiseResult: Promise<void> | undefined

		try {
			promiseResult = guard(to, from, next) as Promise<void> | undefined
		} catch {
			if (!resolved) {
				resolved = true
				if (timer) clearTimeout(timer)
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
			}
			return
		}

		if (promiseResult) {
			promiseResult
				.then(() => {
					// Promise 守卫 resolve 时，若未调用 next() 则自动放行
					if (!resolved) {
						resolved = true
						if (timer) clearTimeout(timer)
						resolve({ type: 'next' })
					} else {
						// next() 已被调用且守卫返回了 Promise：两种解析模式混用
						// next() 之后的异步错误会被静默吞掉，开发者应选择其中一种
						warn(`Navigation guard "${guard.name || 'anonymous'}" called next() and also returned a Promise. Use either next() callback or async/await, not both.`)
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
	})
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
	 */
	function runAfterGuards(to: RouteLocation, from: RouteLocation): void {
		for (const guard of afterGuards) {
			try {
				guard(to, from)
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
