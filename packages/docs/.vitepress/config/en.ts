import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = 'Encapsulated based on the official routing API of Uni-App'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
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
			pattern: 'https://github.com/MengXi-Studio/uni-router/tree/master/packages/docs/:path',
			text: 'Suggest changes to this page'
		},

		outlineTitle: 'Contents of this page',

		nav: [
			{
				text: 'Guide',
				link: '/guide/',
				activeMatch: '^/guide/'
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
			}
		],

		sidebar: {
			'/': [
				{
					text: 'Setup',
					items: [
						{
							text: 'Introduction',
							link: '/introduction.html'
						},
						{
							text: 'Installation',
							link: '/installation.html'
						}
					]
				},
				{
					text: 'Essentials',
					items: [
						{
							text: 'Getting Started',
							link: '/guide/'
						}
					]
				}
			]
		}
	}
}
