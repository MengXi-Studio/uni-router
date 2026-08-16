import type { RouteLocation, RouteLocationRaw } from './route'
import type { NavigationFailure } from './error'

/**
 * 导航守卫重定向方式
 *
 * 用于 next(location, options) 的 options.mode，指定重定向使用的导航方式。
 * 未指定时沿用触发守卫的原始导航方式。
 */
export type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'

/**
 * 导航守卫 next 回调的可选参数
 *
 * @deprecated 自 v2.1.0 起弃用，新代码应使用返回值模式替代 next 回调。
 * 详见 NavigationGuard 文档。
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
 *
 * @deprecated 自 v2.1.0 起弃用，新代码应使用返回值模式。
 * 守卫函数通过返回值控制导航行为：
 * - `return undefined` / `return true` — 放行
 * - `return false` — 中止导航
 * - `return '/login'` / `return { name: 'login' }` — 重定向
 * - `throw new Error()` — 取消导航
 *
 * @param to - 传入 false 中断导航，传入路由位置重定向，不传参数则放行
 * @param options - 重定向选项，仅在传入 location 重定向时生效
 */
export type NavigationGuardNext = (to?: RouteLocationRaw | false, options?: NavigationGuardNextOptions) => void

/**
 * 导航守卫的返回值类型
 *
 * 守卫函数可通过返回值控制导航行为：
 * - `undefined` / `void` / `true` — 放行导航
 * - `false` — 中止导航（NAVIGATION_ABORTED）
 * - `string` — 重定向到路径（如 `'/login'`）
 * - `RouteLocationRaw` — 重定向到路由位置（如 `{ name: 'login' }`）
 * - `Error` — 取消导航（NAVIGATION_CANCELLED）
 * - `null` — 等同于 undefined，放行导航
 */
export type NavigationGuardReturn = void | undefined | boolean | RouteLocationRaw | Error | null

/**
 * 前置导航守卫函数类型
 *
 * 支持两种模式：
 *
 * **1. 返回值模式（推荐，v2.1.0+）**
 * ```typescript
 * router.beforeEach((to, from) => {
 *   if (to.meta.requireAuth && !isLoggedIn()) {
 *     return { name: 'login' }  // 重定向
 *   }
 *   // 不返回值或 return true 表示放行
 * })
 *
 * // 异步守卫
 * router.beforeEach(async (to) => {
 *   const user = await fetchUser()
 *   if (!user) return '/login'
 * })
 * ```
 *
 * **2. next 回调模式（已弃用，v2.0.x 及更早）**
 * ```typescript
 * router.beforeEach((to, from, next) => {
 *   if (condition) {
 *     next('/login')
 *   } else {
 *     next()
 *   }
 * })
 * ```
 *
 * @param to - 即将进入的目标路由
 * @param from - 当前导航正要离开的路由
 * @param next - （已弃用）必须调用以 resolve 此守卫。新代码应使用返回值模式
 */
export type NavigationGuard = (to: RouteLocation, from: RouteLocation, next?: NavigationGuardNext) => NavigationGuardReturn | Promise<NavigationGuardReturn>

/**
 * 后置导航钩子函数类型
 *
 * 在导航完成后执行，不影响导航结果。
 * 第三个参数 failure 在导航失败时传入，可用于区分成功/失败导航。
 *
 * @param to - 已进入的目标路由
 * @param from - 离开的路由
 * @param failure - 导航失败时的错误信息，成功时为空
 */
export type PostNavigationGuard = (to: RouteLocation, from: RouteLocation, failure?: NavigationFailure | null) => void
