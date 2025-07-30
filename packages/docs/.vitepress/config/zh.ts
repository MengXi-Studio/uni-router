import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/zh/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = '基于 Uni-App 的官方路由 API 进行封装'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	description: META_DESCRIPTION,
	head: [
		['meta', { property: 'og:url', content: META_URL }],
		['meta', { property: 'og:description', content: META_DESCRIPTION }],
		['meta', { property: 'twitter:url', content: META_URL }],
		['meta', { property: 'twitter:title', content: META_TITLE }],
		['meta', { property: 'twitter:description', content: META_DESCRIPTION }]
	],

	themeConfig: {
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/Uni Router/tree/master/packages/docs/:path',
			text: '对本页提出修改建议'
		},

		outlineTitle: '本页内容',

		nav: [
			{
				text: '教程',
				link: '/zh/guide/',
				activeMatch: '^/zh/guide/'
			},
			{
				text: '相关链接',
				items: [
					{
						text: 'Discussions',
						link: 'https://github.com/MengXi-Studio/Uni Router/discussions'
					},
					{
						text: '更新日志',
						link: 'https://github.com/MengXi-Studio/Uni Router/releases'
					}
				]
			}
		],

		sidebar: {
			'/zh/': [
				{
					text: '设置',
					items: [
						{
							text: '介绍',
							link: '/zh/introduction.html'
						},
						{
							text: '安装',
							link: '/zh/installation.html'
						}
					]
				},
				{
					text: '基础',
					items: [
						{
							text: '入门',
							link: '/zh/guide/'
						}
					]
				}
			]
		}
	}
}

export const zhSearch: DefaultTheme.AlgoliaSearchOptions['locales'] = {
	zh: {
		placeholder: '搜索文档',
		translations: {
			button: {
				buttonText: '搜索文档',
				buttonAriaLabel: '搜索文档'
			},
			modal: {
				searchBox: {
					resetButtonTitle: '清除查询条件',
					resetButtonAriaLabel: '清除查询条件',
					cancelButtonText: '取消',
					cancelButtonAriaLabel: '取消'
				},
				startScreen: {
					recentSearchesTitle: '搜索历史',
					noRecentSearchesText: '没有搜索历史',
					saveRecentSearchButtonTitle: '保存至搜索历史',
					removeRecentSearchButtonTitle: '从搜索历史中移除',
					favoriteSearchesTitle: '收藏',
					removeFavoriteSearchButtonTitle: '从收藏中移除'
				},
				errorScreen: {
					titleText: '无法获取结果',
					helpText: '你可能需要检查你的网络连接'
				},
				footer: {
					selectText: '选择',
					navigateText: '切换',
					closeText: '关闭',
					searchByText: '搜索供应商'
				},
				noResultsScreen: {
					noResultsText: '无法找到相关结果',
					suggestedQueryText: '你可以尝试查询',
					reportMissingResultsText: '你认为该查询应该有结果？',
					reportMissingResultsLinkText: '点击反馈'
				}
			}
		}
	}
}
