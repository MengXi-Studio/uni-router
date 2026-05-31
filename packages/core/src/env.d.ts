/**
 * uni-app 页面实例的类型声明
 */
interface UniPage {
	/** 页面路由路径（不含前导 `/`） */
	route: string
	/** 页面启动参数 */
	options?: Record<string, string | undefined>
}

/**
 * uni 导航 API 的通用选项
 */
interface UniNavigateOptions {
	/** 目标页面 URL（可包含查询参数） */
	url: string
	/** 导航成功回调 */
	success?: () => void
	/** 导航失败回调 */
	fail?: (err: unknown) => void
	/** 导航完成回调（无论成功或失败） */
	complete?: () => void
}

/**
 * uni.navigateBack API 的选项
 */
interface UniNavigateBackOptions {
	/** 返回的页面数，默认为 1 */
	delta?: number
	/** 导航成功回调 */
	success?: () => void
	/** 导航失败回调 */
	fail?: (err: unknown) => void
	/** 导航完成回调（无论成功或失败） */
	complete?: () => void
}

/**
 * 获取当前页面栈
 * @returns 页面实例数组，数组中第一个元素为首页，最后一个元素为当前页面
 */
declare function getCurrentPages(): UniPage[]

/**
 * uni-app 全局 API 声明
 */
declare const uni: {
	/** 保留当前页面，跳转到应用内的某个页面 */
	navigateTo(options: UniNavigateOptions): void
	/** 关闭当前页面，跳转到应用内的某个页面 */
	redirectTo(options: UniNavigateOptions): void
	/** 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面 */
	switchTab(options: UniNavigateOptions): void
	/** 关闭当前页面，返回上一页面或多级页面 */
	navigateBack(options: UniNavigateBackOptions): void
	/** 动态设置当前页面的标题 */
	setNavigationBarTitle(options: { title: string }): void
}
