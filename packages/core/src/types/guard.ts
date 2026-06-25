import type { RouteLocation, RouteLocationRaw } from './route'

/**
 * 导航守卫重定向方式
 *
 * 用于 next(location, options) 的 options.mode，指定重定向使用的导航方式。
 * 未指定时沿用触发守卫的原始导航方式。
 */
export type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'

/**
 * 导航守卫 next 回调的可选参数
 */
export interface NavigationGuardNextOptions {
	/**
	 * 重定向使用的导航方式
	 *
	 * 仅在 next(location) 重定向时生效。
	 * 未指定时沿用触发守卫的原始导航方式（push/replace/relaunch）；
	 * 原始导航为 back 时，重定向回退为 relaunch。
	 */
	mode?: NavigationRedirectMode
}

/**
 * 导航守卫的 next 回调函数
 * @param to - 传入 false 中断导航，传入路由位置重定向，不传参数则放行
 * @param options - 重定向选项，仅在传入 location 重定向时生效
 */
export type NavigationGuardNext = (to?: RouteLocationRaw | false, options?: NavigationGuardNextOptions) => void

/**
 * 前置导航守卫函数类型
 * @param to - 即将进入的目标路由
 * @param from - 当前导航正要离开的路由
 * @param next - 必须调用以 resolve 此守卫
 */
export type NavigationGuard = (to: RouteLocation, from: RouteLocation, next: NavigationGuardNext) => void | Promise<void>

/**
 * 后置导航钩子函数类型
 * @param to - 已进入的目标路由
 * @param from - 离开的路由
 */
export type PostNavigationGuard = (to: RouteLocation, from: RouteLocation) => void
