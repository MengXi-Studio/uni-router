import type { NavigationGuard, NavigationGuardNext, PostNavigationGuard, RouteConfig, RouteLocation, RouteLocationRaw } from '@/types'
import { RouterErrorCode } from '@/types/error'

/**
 * 守卫执行结果，表示导航是被放行、重定向还是中止
 */
export type GuardResult = { type: 'next'; redirect?: RouteLocationRaw } | { type: 'abort'; code: RouterErrorCode }

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
 * - 抛出异常或返回 rejected Promise 将取消导航
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @returns 守卫执行结果
 */
function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
	return new Promise(resolve => {
		let resolved = false

		const next: NavigationGuardNext = (location?: RouteLocationRaw | false) => {
			if (resolved) return
			resolved = true

			if (location === false) {
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_ABORTED })
			} else if (location) {
				resolve({ type: 'next', redirect: location })
			} else {
				resolve({ type: 'next' })
			}
		}

		let promiseResult: Promise<void> | undefined

		try {
			promiseResult = guard(to, from, next) as Promise<void> | undefined
		} catch {
			if (!resolved) {
				resolved = true
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
			}
			return
		}

		if (promiseResult) {
			promiseResult.catch(() => {
				if (!resolved) {
					resolved = true
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
async function runGuardQueue(guards: NavigationGuard[], to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
	for (const guard of guards) {
		const result = await runGuard(guard, to, from)
		if (result.type === 'abort') return result
		if (result.redirect) return result
	}
	return { type: 'next' }
}

/**
 * 创建守卫管理器实例
 * @returns 守卫管理器
 */
export function createGuardManager(): GuardManager {
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
		return runGuardQueue(beforeGuards, to, from)
	}

	/**
	 * 执行全局解析守卫队列
	 * @param to - 目标路由
	 * @param from - 来源路由
	 */
	function runBeforeResolveGuards(to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
		return runGuardQueue(beforeResolveGuards, to, from)
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

		return runGuardQueue(guards, to, from)
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
