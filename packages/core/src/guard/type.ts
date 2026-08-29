import type { NavigationGuard, PostNavigationGuard, RouteConfig, RouteLocation, RouteLocationRaw, NavigationRedirectMode, BackGuard } from '@/types'
import type { NavigationFailure } from '@/types/error'
import type { RouterErrorCode } from '@/enums'

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
