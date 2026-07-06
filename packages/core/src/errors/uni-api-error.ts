import type { UniApiCause, UniApiError as UniApiErrorType } from '@/types/error'

/**
 * uni API 调用失败时的错误封装
 *
 * 当 uni.navigateTo / uni.redirectTo 等导航 API 调用失败时，
 * 将错误原因封装为此类实例，作为 {@link NavigationFailure.cause} 传递。
 */
export class UniApiError extends Error {
	/** 调用失败的 API 名称（如 navigateTo / redirectTo） */
	readonly api: string
	/** 原始错误原因 */
	readonly cause: UniApiCause

	/**
	 * @param api - 失败的 uni API 名称
	 * @param cause - 原始错误对象
	 */
	constructor(api: string, cause: UniApiCause) {
		super(`[uni-router] uni.${api} failed`)
		this.name = 'UniApiError'
		this.api = api
		this.cause = cause
	}
}

/**
 * 检查错误是否为 uni API 调用失败
 * @param error - 待检查的值
 * @returns 是 UniApiError 时返回 true
 */
export function isUniApiError(error: unknown): error is UniApiErrorType {
	return error instanceof UniApiError
}
