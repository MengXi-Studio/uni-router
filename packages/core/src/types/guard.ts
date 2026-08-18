import type { RouteLocation, RouteLocationRaw } from './route'
import type { NavigationFailure } from './error'

/**
 * 导航守卫重定向方式
 *
 * 通过守卫返回值中的 `mode` 字段指定重定向使用的导航方式。
 * 未指定时沿用触发守卫的原始导航方式。
 */
export type NavigationRedirectMode = 'push' | 'replace' | 'relaunch'

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
 * 通过返回值控制导航行为，与 Vue Router 4.x 一致：
 *
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
 * @param to - 即将进入的目标路由
 * @param from - 当前导航正要离开的路由
 * @returns 返回值控制导航行为：undefined/true=放行，false=中止，RouteLocationRaw=重定向，Error=取消
 */
export type NavigationGuard = (to: RouteLocation, from: RouteLocation) => NavigationGuardReturn | Promise<NavigationGuardReturn>

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

/**
 * 组件内离开守卫函数类型
 *
 * 用于 onBeforeRouteLeave 组合式 API，与 Vue Router 4.x 一致。
 * 通过返回值控制导航行为。
 *
 * @param to - 即将进入的目标路由
 * @param from - 当前正要离开的路由
 * @returns 返回值控制导航行为：undefined/true=放行，false=中止，RouteLocationRaw=重定向，Error=取消
 */
export type RouteLeaveGuard = (to: RouteLocation, from: RouteLocation) => NavigationGuardReturn | Promise<NavigationGuardReturn>
