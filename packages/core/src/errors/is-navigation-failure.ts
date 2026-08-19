import { NavigationFailure } from './navigation-failure'
import type { RouterErrorCode } from '@/types/error'

/**
 * 检查一个错误是否为特定类型的导航失败
 *
 * 与 Vue Router 4.x 的 `isNavigationFailure` 行为一致，用于在 catch 块中
 * 精准判断导航失败的类型，无需手动检查 instanceof 和 error.code。
 *
 * 当不传 `code` 时，仅检查是否为 NavigationFailure 实例。
 * 传入 `code` 时，同时检查错误码，将类型收窄为特定导航失败。
 *
 * @param error - 捕获的错误对象
 * @param code - 可选的错误码，传入时同时检查错误类型和错误码
 * @returns 匹配时返回 true，同时将 error 的类型收窄为 NavigationFailure
 *
 * @example
 * ```ts
 * import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'
 *
 * try {
 *   await router.push('/somewhere')
 * } catch (error) {
 *   if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED)) {
 *     // 忽略重复导航
 *   } else if (isNavigationFailure(error)) {
 *     // 其他导航失败
 *   }
 * }
 * ```
 */
export function isNavigationFailure(error: unknown, code?: RouterErrorCode): error is NavigationFailure {
	return error instanceof NavigationFailure && (code ? error.code === code : true)
}
