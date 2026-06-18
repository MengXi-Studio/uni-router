import type { RouteConfig } from './uni_modules/mxuni-router/js_sdk/index.js'

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 *
 * 类型定义（RouteConfig / RouteMeta / NavigationAnimation 等）统一从 mxuni-router 导入，
 * 避免重复定义导致与 mxuni-router 实现不一致。
 */
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: {
			title: '首页'
		}
	},
	{
		path: '/pages/guards/index',
		name: 'pagesGuardsIndex',
		meta: {
			title: '路由守卫'
		},
		beforeEnter(to, from, next) {
			console.log('[beforeEnter] 路由独享守卫:', from.fullPath, '->', to.fullPath)
			next()
		}
	},
	{
		path: '/pages/about/index',
		name: 'pagesAboutIndex',
		meta: {
			title: '关于',
			animation: { type: 'slide-in-right' }
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
	},
	{
		path: '/pages/event-channel/index',
		name: 'pagesEventChannelIndex',
		meta: {
			title: '页面间通信'
		}
	},
	{
		path: '/pages/composable/index',
		name: 'pagesComposableIndex',
		meta: {
			title: '组合式 API'
		}
	}
]

export default routes
