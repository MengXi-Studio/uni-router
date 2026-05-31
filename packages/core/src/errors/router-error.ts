import type { RouterErrorCode } from '@/types/error'

/**
 * 路由错误类，表示路由过程中产生的错误
 */
export class RouterError extends Error {
	/** 错误码 */
	readonly code: RouterErrorCode

	/**
	 * @param code - 错误码
	 * @param message - 错误信息（会自动添加 [uni-router] 前缀）
	 */
	constructor(code: RouterErrorCode, message: string) {
		super(`[uni-router] ${message}`)
		this.name = 'RouterError'
		this.code = code
	}
}
