/**
 * 动画持续时间默认值（ms），与 uni-app 官方默认值一致
 */
export const DEFAULT_ANIMATION_DURATION = 300

/**
 * 守卫超时时间默认值（ms）
 *
 * 守卫函数在此时间内未返回结果或抛出异常时，将输出警告并自动中止导航，防止永久挂起。
 */
export const DEFAULT_GUARD_TIMEOUT = 10000

/**
 * 路由器就绪超时时间默认值（ms），0 表示永不超时
 */
export const DEFAULT_READY_TIMEOUT = 0

/**
 * 最大重定向深度，超过此值将取消导航以防止无限循环
 */
export const MAX_REDIRECT_DEPTH = 10
