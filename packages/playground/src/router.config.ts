/**
 * @plugin generate-router
 * @date 2026-07-08 19:09:39
 * @version 1.0.0
 */

import type { RouteConfig } from '@meng-xi/uni-router'

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
		meta: { title: '路由守卫' }
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
