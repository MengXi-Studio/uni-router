/**
 * 导航动画类型
 *
 * 用于 uni.navigateTo / uni.navigateBack 的 animationType 参数，
 * 仅 App 端生效，其他平台自动忽略。
 *
 * 显示动画（navigateTo）：slide-in-right / slide-in-left / slide-in-top / slide-in-bottom / pop-in / fade-in / zoom-out / zoom-fade-out / none / auto
 * 关闭动画（navigateBack）：slide-out-right / slide-out-left / slide-out-top / slide-out-bottom / pop-out / fade-out / zoom-in / zoom-fade-in / none / auto
 *
 * @see https://en.uniapp.dcloud.io/api/router.html#animation
 */
export type UniAnimationType =
	| 'auto'
	| 'none'
	| 'slide-in-right'
	| 'slide-in-left'
	| 'slide-in-top'
	| 'slide-in-bottom'
	| 'slide-out-right'
	| 'slide-out-left'
	| 'slide-out-top'
	| 'slide-out-bottom'
	| 'fade-in'
	| 'fade-out'
	| 'zoom-out'
	| 'zoom-in'
	| 'zoom-fade-out'
	| 'zoom-fade-in'
	| 'pop-in'
	| 'pop-out'

/**
 * 导航动画配置
 *
 * 仅 App 端生效，其他平台自动忽略。
 * 优先级：push/replace 调用时传入 > meta.animation > uni 默认值
 */
export interface NavigationAnimation {
	/** 窗口动画类型 */
	type: UniAnimationType
	/** 动画持续时间（ms），默认 300 */
	duration?: number
}

/**
 * 路由元信息
 */
export interface RouteMeta {
	/** 页面标题 */
	title?: string
	/** 是否为TabBar页面 */
	isTab?: boolean
	/** 是否需要登录 */
	requireAuth?: boolean
	/** 默认导航动画（仅 App 端生效），可被 push/replace 时的 animation 参数覆盖 */
	animation?: NavigationAnimation
	/** 自定义扩展字段 */
	[key: string]: any
}

/**
 * 路由配置项
 */
export interface RouteConfig {
	/** 路由路径 */
	path: string
	/** 路由名称（用于命名路由导航） */
	name?: string
	/** 路由元信息 */
	meta?: RouteMeta
	/** 自定义扩展字段 */
	[key: string]: any
}

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 */
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '首页 - uni-router 演示', isTab: true }
	},
	{
		path: '/pages/navigation/navigation',
		name: 'pagesNavigationNavigation',
		meta: { title: '路由导航' }
	},
	{
		path: '/pages/guards/guards',
		name: 'pagesGuardsGuards',
		meta: { title: '路由守卫' },
		beforeEnter(to: { fullPath: any }, from: { fullPath: any }, next: () => void) {
			console.log('[beforeEnter] 路由独享守卫:', from.fullPath, '->', to.fullPath)
			next()
		}
	},
	{
		path: '/pages/detail/detail',
		name: 'pagesDetailDetail',
		meta: { title: '详情页' }
	},
	{
		path: '/pages/protected/protected',
		name: 'pagesProtectedProtected',
		meta: { title: '受保护页面', requireAuth: true }
	},
	{
		path: '/pages/login/login',
		name: 'pagesLoginLogin',
		meta: { title: '登录' }
	},
	{
		path: '/pages/about/about',
		name: 'pagesAboutAbout',
		meta: { title: '关于', isTab: true }
	},
	{
		path: '/pages/resolve/resolve',
		name: 'pagesResolveResolve',
		meta: { title: '路由解析' }
	},
	{
		path: '/pages/error/error',
		name: 'pagesErrorError',
		meta: { title: '错误处理' }
	},
	{
		path: '/pages/event-channel/event-channel',
		name: 'pagesEventChannelEventChannel',
		meta: { title: '页面间通信' }
	},
	{
		path: '/pages-sub/profile/profile',
		name: 'pagesSubProfileProfile',
		meta: { title: '个人中心' }
	},
	{
		path: '/pages-sub/settings/settings',
		name: 'pagesSubSettingsSettings',
		meta: { title: '设置', requireAuth: true }
	}
]

export default routes
