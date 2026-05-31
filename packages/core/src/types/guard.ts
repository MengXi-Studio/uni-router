import type { RouteLocation, RouteLocationRaw } from './route'

/**
 * 导航守卫的 next 回调函数
 * @param to - 传入 false 中断导航，传入路由位置重定向，不传参数则放行
 */
export type NavigationGuardNext = (to?: RouteLocationRaw | false) => void

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
