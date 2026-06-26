/**
 * 路由器 provide/inject 的 Symbol 标识
 *
 * 用于在 Vue 应用中通过 `app.provide(ROUTER_SYMBOL, router)` 注入路由器实例，
 * 组合式 API `useRouter()` 通过 `inject(ROUTER_SYMBOL)` 获取。
 */
export const ROUTER_SYMBOL = Symbol('uni-router')
