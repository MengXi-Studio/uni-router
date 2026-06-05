
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
	/** 自定义扩展字段 */
	[key: string]: unknown
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
}

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 */
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: {
			title: '首页 - uni-router 演示',
			isTab: true
		}
	},
	{
		path: '/pages/navigation/navigation',
		name: 'pagesNavigationNavigation',
		meta: {
			title: '路由导航'
		}
	},
	{
		path: '/pages/guards/guards',
		name: 'pagesGuardsGuards',
		meta: {
			title: '路由守卫'
		}
	},
	{
		path: '/pages/detail/detail',
		name: 'pagesDetailDetail',
		meta: {
			title: '详情页'
		}
	},
	{
		path: '/pages/protected/protected',
		name: 'pagesProtectedProtected',
		meta: {
			title: '受保护页面',
			requireAuth: true
		}
	},
	{
		path: '/pages/login/login',
		name: 'pagesLoginLogin',
		meta: {
			title: '登录'
		}
	},
	{
		path: '/pages/about/about',
		name: 'pagesAboutAbout',
		meta: {
			title: '关于',
			isTab: true
		}
	},
	{
		path: '/pages/resolve/resolve',
		name: 'pagesResolveResolve',
		meta: {
			title: '路由解析'
		}
	},
	{
		path: '/pages/error/error',
		name: 'pagesErrorError',
		meta: {
			title: '错误处理'
		}
	},
	{
		path: '/pages-sub/profile/profile',
		name: 'pagesSubProfileProfile',
		meta: {
			title: '个人中心'
		}
	},
	{
		path: '/pages-sub/settings/settings',
		name: 'pagesSubSettingsSettings',
		meta: {
			title: '设置',
			requireAuth: true
		}
	}
]

export default routes
