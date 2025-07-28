/** 路由错误类型 */
export enum RouterErrorType {
	/** 导航中止 */
	NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
	/** 导航重定向 */
	NAVIGATION_REDIRECT = 'NAVIGATION_REDIRECT',
	/** 导航失败 */
	NAVIGATION_FAILED = 'NAVIGATION_FAILED',
	/** 无效方法 */
	INVALID_METHOD = 'INVALID_METHOD'
}

/** 支持动画的平台列表 */
export const ANIMATION_SUPPORTED_PLATFORMS: string[] = ['app', 'app-plus', 'app-plus-nvue', 'app-nvue', 'app-android', 'app-ios', 'app-harmony']
