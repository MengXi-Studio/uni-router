/**
 * @plugin generate-router
 * @date 2026-06-21 23:15:04
 * @version 0.2.2
 */

import type { RouteConfig } from './uni_modules/mxuni-router/js_sdk'

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 */
export const routes: RouteConfig[] = [
	{
		path: '/pages/index/index',
		name: 'pagesIndexIndex',
		meta: { title: '首页' }
	},
	{
		path: '/pages/guards/index',
		name: 'pagesGuardsIndex',
		meta: { title: '路由守卫' },
		beforeEnter(to, from, next) {
			console.log(`[beforeEnter] 路由独享守卫: ${from.path} → ${to.path}`)
			next()
		}
	},
	{
		path: '/pages/about/index',
		name: 'pagesAboutIndex',
		meta: { title: '关于' }
	},
	{
		path: '/pages/protected/index',
		name: 'pagesProtectedIndex',
		meta: { title: '受保护页面', requireAuth: true }
	},
	{
		path: '/pages/login/index',
		name: 'pagesLoginIndex',
		meta: { title: '登录' }
	},
	{
		path: '/pages/event-channel/index',
		name: 'pagesEventChannelIndex',
		meta: { title: '页面间通信' }
	},
	{
		path: '/pages/composable/index',
		name: 'pagesComposableIndex',
		meta: { title: '组合式 API' }
	}
]

export default routes
