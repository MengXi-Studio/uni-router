import type { RouteLocation } from '@/types'
import type { RouterErrorCode, UniApiError } from '@/types/error'
import { RouterError } from './router-error'

/**
 * 导航失败类，表示导航过程中产生的失败，包含来源和目标路由信息
 */
export class NavigationFailure extends RouterError {
	/** 目标路由 */
	readonly to: RouteLocation
	/** 来源路由 */
	readonly from: RouteLocation
	/** 原始错误原因 */
	readonly cause?: UniApiError

	/**
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param code - 错误码
	 * @param message - 可选的错误信息，默认自动生成
	 * @param cause - 原始错误原因
	 */
	constructor(to: RouteLocation, from: RouteLocation, code: RouterErrorCode, message?: string, cause?: UniApiError) {
		super(code, message ?? `Navigation failed from "${from.fullPath}" to "${to.fullPath}"`)
		this.name = 'NavigationFailure'
		this.to = to
		this.from = from
		this.cause = cause
	}
}
