/**
 * 导航守卫的 next 回调函数
 */
type NavigationGuardNext = (to?: import('./uni_modules/mxuni-router/js_sdk/index').RouteLocationRaw | false) => void

/**
 * 前置导航守卫函数类型
 */
type NavigationGuard = (to: import('./uni_modules/mxuni-router/js_sdk/index').RouteLocation, from: import('./uni_modules/mxuni-router/js_sdk/index').RouteLocation, next: NavigationGuardNext) => void | Promise<void>

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
	/** 路由独享守卫，进入该路由时触发 */
	beforeEnter?: NavigationGuard | NavigationGuard[]
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
			title: 'uni-app'
		}
	},
	{
		path: '/pages/guards/index',
		name: 'pagesGuardsIndex',
		meta: {
			title: '路由守卫'
		},
		beforeEnter(to, from, next) {
			console.log('[beforeEnter] 路由独享守卫:', from.fullPath, '→', to.fullPath)
			next()
		}
	},
	{
		path: '/pages/about/index',
		name: 'pagesAboutIndex',
		meta: {
			title: '关于'
		}
	},
	{
		path: '/pages/protected/index',
		name: 'pagesProtectedIndex',
		meta: {
			title: '受保护页面',
			requireAuth: true
		}
	},
	{
		path: '/pages/login/index',
		name: 'pagesLoginIndex',
		meta: {
			title: '登录'
		}
	}
]

export default routes
