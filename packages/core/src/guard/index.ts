import type { NavigationGuard, PostNavigationGuard, RouteConfig, RouteLocation, BackGuard } from '@/types'
import { DEFAULT_GUARD_TIMEOUT } from '@/constants'
import type { NavigationFailure } from '@/types/error'
import type { GuardResult, GuardManager } from './type'
import { runGuardQueue } from './helpers'
export type { GuardResult, GuardManager } from './type'

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
