import { RouterErrorType } from '@/constants'
import type { RouteLocationRaw } from '@/type'

/**
 * 路由错误类，继承自 JavaScript 的原生 Error 类，用于表示在路由过程中出现的各类错误
 */
export class RouterError extends Error {
	/**
	 * 错误类型，使用 RouterErrorType 枚举来定义具体的错误类型
	 * 该枚举包含导航中止、导航重定向、导航失败、无效方法等常见的路由错误类型
	 */
	public type: RouterErrorType
	/**
	 * 错误位置，标识错误发生时对应的路由位置
	 * 可以是字符串类型的路径，也可以是包含路径和查询参数的 RouteLocationRaw 类型对象
	 * 该属性为可选属性，可能不存在
	 */
	public location?: string | RouteLocationRaw

	/**
	 * 构造函数，用于创建 RouterError 实例
	 * @param type 错误类型，使用 RouterErrorType 枚举值
	 * @param message 错误消息，用于描述错误的具体信息
	 * @param location 目标位置，标识错误发生时对应的路由位置，可选参数
	 */
	constructor(type: RouterErrorType, message: string, location?: string | RouteLocationRaw) {
		super(message)
		this.type = type
		this.location = location
		// 手动设置原型，确保在 TypeScript 中继承 Error 类时 instanceof 操作符能正常工作
		Object.setPrototypeOf(this, RouterError.prototype)
	}

	/**
	 * 创建导航中止错误实例
	 * 当导航过程被前置守卫中止时，可使用此方法创建对应的错误对象
	 * @returns 一个表示导航中止错误的 RouterError 实例
	 */
	static navigationAborted(): RouterError {
		return new RouterError(RouterErrorType.NAVIGATION_ABORTED, 'Navigation aborted by guard')
	}

	/**
	 * 创建导航重定向错误实例
	 * 当导航过程中发生重定向时，可使用此方法创建对应的错误对象
	 * @param location 重定向位置，标识重定向后的路由位置
	 * @returns 一个表示导航重定向错误的 RouterError 实例
	 */
	static navigationRedirect(location: string | RouteLocationRaw): RouterError {
		return new RouterError(RouterErrorType.NAVIGATION_REDIRECT, 'Navigation redirected', location)
	}

	/**
	 * 创建导航失败错误实例
	 * 当导航过程中出现异常导致失败时，可使用此方法创建对应的错误对象
	 * @param message 错误信息，用于描述导航失败的具体原因，若未提供则使用默认信息
	 * @returns 一个表示导航失败错误的 RouterError 实例
	 */
	static navigationFailed(message: string): RouterError {
		return new RouterError(RouterErrorType.NAVIGATION_FAILED, message || 'Navigation failed')
	}

	/**
	 * 创建无效方法错误实例
	 * 当尝试使用无效的导航方法时，可使用此方法创建对应的错误对象
	 * @param method 方法名，标识尝试使用的无效导航方法
	 * @returns 一个表示无效方法错误的 RouterError 实例
	 */
	static invalidMethod(method: string): RouterError {
		return new RouterError(RouterErrorType.INVALID_METHOD, `Navigation method ${method} not available`)
	}
}
