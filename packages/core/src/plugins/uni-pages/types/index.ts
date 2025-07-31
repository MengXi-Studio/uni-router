/** pages.json 配置项 */
export interface PagesConfig {
	/** 设置默认页面的窗口表现 */
	globalStyle?: object
	/** 设置页面路径及窗口表现 */
	pages?: object[]
	/**
	 * 组件自动引入规则
	 *
	 * @description 2.5.5+
	 */
	easycom?: object
	/** 设置底部 tab 的表现 */
	tabBar?: object
	/** 启动模式配置 */
	condition?: object
	/**
	 * 分包加载配置
	 *
	 * @description H5 不支持
	 */
	subPackages?: object[]
	/**
	 * 分包预下载规则
	 *
	 * @description 微信小程序、支付宝小程序
	 */
	preloadRule?: object
	/**
	 * Worker 代码放置的目录
	 *
	 * @description 微信小程序、支付宝小程序
	 */
	workers?: object
	/**
	 * 大屏左侧窗口
	 *
	 * @description H5
	 */
	leftWindow?: object
	/**
	 * 大屏顶部窗口
	 *
	 * @description H5
	 */
	topWindow?: object
	/**
	 * 大屏右侧窗口
	 *
	 * @description H5
	 */
	rightWindow?: object
	/**
	 * 自动跳转相关配置
	 *
	 * @description HBuilderX 3.5.0
	 */
	uniIdRouter?: object
	/**
	 * 默认启动首页
	 *
	 * @description HBuilderX 3.7.0 微信小程序、支付宝小程序、抖音小程序
	 */
	entryPagePath?: string

	[key: string]: any
}

export interface UserPagesConfig extends PagesConfig {}
