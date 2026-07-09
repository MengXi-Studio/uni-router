import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { versionNav } from './shared'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = '为 uni-app 提供类似 vue-router 风格的路由管理系统'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

	/** 网站配置 头信息 */
	head: [
		['meta', { property: 'og:url', content: META_URL }],
		['meta', { property: 'og:description', content: META_DESCRIPTION }],
		['meta', { property: 'twitter:url', content: META_URL }],
		['meta', { property: 'twitter:title', content: META_TITLE }],
		['meta', { property: 'twitter:description', content: META_DESCRIPTION }]
	],

	/** 网站配置 主题配置 */
	themeConfig: {
		/** 网站主题配置 编辑链接 */
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/uni-router/edit/main/packages/docs/:path',
			text: '对本页提出修改建议'
		},

		/** 网站主题配置 大纲标题 */
		outlineTitle: '本页内容',

		/** 网站主题配置 导航栏 */
		nav: [
			{ text: '指南', link: '/guide/getting-started' },
			{ text: 'API', link: '/api/create-router' },
			{
				text: '相关链接',
				items: [
					{
						text: 'Discussions',
						link: 'https://github.com/MengXi-Studio/uni-router/discussions'
					},
					{
						text: '更新日志',
						link: 'https://github.com/MengXi-Studio/uni-router/releases'
					}
				]
			},
			versionNav
		],

		sidebar: {
			'/guide/': [
				{
					text: '入门',
					items: [
						{
							text: '介绍',
							link: '/guide/introduction'
						},
						{
							text: '安装',
							link: '/guide/installation'
						},
						{
							text: '快速开始',
							link: '/guide/getting-started'
						}
					]
				},
				{
					text: '核心功能',
					items: [
						{
							text: '路由配置',
							link: '/guide/route-config'
						},
						{
							text: '路由导航',
							link: '/guide/navigation'
						},
						{
							text: '路由守卫',
							link: '/guide/guards'
						},
						{
							text: '路由元信息',
							link: '/guide/meta'
						},
						{
							text: '组合式 API',
							link: '/guide/composables'
						}
					]
				},
				{
					text: '原理深入',
					items: [
						{
							text: '导航流程原理',
							link: '/guide/navigation-flow'
						},
						{
							text: '拦截器机制',
							link: '/guide/interceptor'
						},
						{
							text: '错误处理',
							link: '/guide/error-handling'
						}
					]
				},
				{
					text: '进阶',
					items: [
						{
							text: '自动生成路由配置',
							link: '/guide/auto-generate'
						},
						{
							text: '平台兼容性',
							link: '/guide/compatibility'
						},
						{
							text: '与 vue-router 的差异',
							link: '/guide/differences'
						},
						{
							text: '实战指南',
							link: '/guide/recipes'
						},
						{
							text: '常见问题',
							link: '/guide/faq'
						}
					]
				}
			],
			'/api/': [
				{
					text: '核心 API',
					items: [
						{
							text: 'createRouter()',
							link: '/api/create-router'
						},
						{
							text: 'Router 实例',
							link: '/api/router-instance'
						},
						{
							text: 'useRouter()',
							link: '/api/use-router'
						},
						{
							text: 'useRoute()',
							link: '/api/use-route'
						},
						{
							text: 'usePageChannel()',
							link: '/api/use-page-channel'
						},
						{
							text: 'RouterLink',
							link: '/api/router-link'
						}
					]
				},
				{
					text: '类型',
					items: [
						{
							text: 'RouterOptions',
							link: '/api/type-router-options'
						},
						{
							text: 'RouteConfig',
							link: '/api/type-route-config'
						},
						{
							text: 'RouteLocation',
							link: '/api/type-route-location'
						},
						{
							text: 'RouteMeta',
							link: '/api/type-route-meta'
						},
						{
							text: 'NavigationGuard',
							link: '/api/type-navigation-guard'
						},
						{
							text: 'RouterErrorCode',
							link: '/api/type-router-error'
						}
					]
				}
			]
		}
	}
}
