import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { versionNav } from './shared'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/en/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = 'Provide a routing management system for uni-app that is similar to the style of vue-router'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

	head: [
		/** 网站配置 头信息 */
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
			text: 'Suggest changes to this page'
		},

		/** 网站主题配置 大纲标题 */
		outlineTitle: 'Contents of this page',

		/** 网站主题配置 导航栏 */
		nav: [
			{
				text: 'Guide',
				link: '/en/guide/getting-started'
			},
			{
				text: 'API',
				link: '/en/api/create-router'
			},
			{
				text: 'Links',
				items: [
					{
						text: 'Discussions',
						link: 'https://github.com/MengXi-Studio/uni-router/discussions'
					},
					{
						text: 'Changelog',
						link: 'https://github.com/MengXi-Studio/uni-router/releases'
					}
				]
			},
			versionNav
		],

		sidebar: {
			'/en/guide/': [
				{
					text: 'Getting Started',
					items: [
						{
							text: 'Introduction',
							link: '/en/guide/introduction'
						},
						{
							text: 'Installation',
							link: '/en/guide/installation'
						},
						{
							text: 'Quick Start',
							link: '/en/guide/getting-started'
						}
					]
				},
				{
					text: 'Core Features',
					items: [
						{
							text: 'Route Configuration',
							link: '/en/guide/route-config'
						},
						{
							text: 'Navigation',
							link: '/en/guide/navigation'
						},
						{
							text: 'Route Guards',
							link: '/en/guide/guards'
						},
						{
							text: 'Route Meta',
							link: '/en/guide/meta'
						},
						{
							text: 'Composables',
							link: '/en/guide/composables'
						}
					]
				},
				{
					text: 'Principles In Depth',
					items: [
						{
							text: 'Navigation Flow',
							link: '/en/guide/navigation-flow'
						},
						{
							text: 'Interceptor Mechanism',
							link: '/en/guide/interceptor'
						},
						{
							text: 'Error Handling',
							link: '/en/guide/error-handling'
						}
					]
				},
				{
					text: 'Advanced',
					items: [
						{
							text: 'Auto-Generating Route Config',
							link: '/en/guide/auto-generate'
						},
						{
							text: 'Platform Compatibility',
							link: '/en/guide/compatibility'
						},
						{
							text: 'Differences from vue-router',
							link: '/en/guide/differences'
						},
						{
							text: 'Recipes',
							link: '/en/guide/recipes'
						},
						{
							text: 'FAQ',
							link: '/en/guide/faq'
						}
					]
				}
			],
			'/en/api/': [
				{
					text: 'Core API',
					items: [
						{
							text: 'createRouter()',
							link: '/en/api/create-router'
						},
						{
							text: 'Router Instance',
							link: '/en/api/router-instance'
						},
						{
							text: 'useRouter()',
							link: '/en/api/use-router'
						},
						{
							text: 'useRoute()',
							link: '/en/api/use-route'
						},
						{
							text: 'RouterLink',
							link: '/en/api/router-link'
						}
					]
				},
				{
					text: 'Types',
					items: [
						{
							text: 'RouterOptions',
							link: '/en/api/type-router-options'
						},
						{
							text: 'RouteConfig',
							link: '/en/api/type-route-config'
						},
						{
							text: 'RouteLocation',
							link: '/en/api/type-route-location'
						},
						{
							text: 'RouteMeta',
							link: '/en/api/type-route-meta'
						},
						{
							text: 'NavigationGuard',
							link: '/en/api/type-navigation-guard'
						},
						{
							text: 'RouterErrorCode',
							link: '/en/api/type-router-error'
						}
					]
				}
			]
		}
	}
}
