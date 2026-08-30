/**
 * 路由错误码枚举
 */
export enum RouterErrorCode {
	/** 导航被守卫中止 */
	NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',

	/** 导航被取消（守卫抛出异常或重定向超限） */
	NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',

	/** 重复导航到当前位置 */
	NAVIGATION_DUPLICATED = 'NAVIGATION_DUPLICATED',

	/** 未找到匹配的路由 */
	ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',

	/** uni 导航 API 调用失败 */
	NAVIGATION_API_ERROR = 'NAVIGATION_API_ERROR',

	/** 使用了插件提供的功能但对应插件未注册 */
	PLUGIN_REQUIRED = 'PLUGIN_REQUIRED',

	/** 路由器初始化或使用方式错误 */
	SETUP_ERROR = 'SETUP_ERROR'
}
