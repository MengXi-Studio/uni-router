/**
 * @plugin generate-router
 * @date 2026-08-23 22:41:14
 * @version 1.1.0
 */

import type { RouteConfig, RouteLocation } from '@meng-xi/uni-router'

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
		// 路由独享守卫（手写补充：generate-router 重新生成时会被覆盖，需重新添加）
		// 仅对进入本路由时生效，配合 guards.vue 的演示文案
		beforeEnter: (to: RouteLocation, from: RouteLocation) => {
			console.log('[beforeEnter] 路由独享守卫：', from.fullPath, '->', to.fullPath)
			// 不返回值表示放行
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
