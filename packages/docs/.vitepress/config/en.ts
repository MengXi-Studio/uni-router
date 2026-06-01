import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = 'Route management system based on Vue Router'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
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
			pattern: 'https://github.com/MengXi-Studio/uni-router/tree/master/packages/docs/:path',
			text: 'Suggest changes to this page'
		},

		/** 网站主题配置 大纲标题 */
		outlineTitle: 'Contents of this page',

		/** 网站主题配置 导航栏 */
		nav: [
			{
				text: 'Common Utils',
				link: '/en/common/index.html'
			},
			{
				text: 'Plugin Factory',
				link: '/en/factory/index.html'
			},
			{
				text: 'Logger',
				link: '/en/logger/index.html'
			},
			{
				text: 'Plugins',
				link: '/en/plugins/index.html'
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

		/** 网站主题配置 侧边栏 */
		sidebar: {
			'/en/': [
				{
					text: 'Setup',
					items: [
						{
							text: 'Introduction',
							link: '/en/introduction.html'
						},
						{
							text: 'Installation',
							link: '/en/installation.html'
						}
					]
				},

				{
					text: 'Common Utils',
					items: [
						{
							text: 'Overview',
							link: '/en/common/index.html'
						},
						{
							text: 'Compress',
							link: '/en/common/compress.html'
						},
						{
							text: 'File System',
							link: '/en/common/fs.html'
						},
						{
							text: 'Format',
							link: '/en/common/format.html'
						},
						{
							text: 'HTML',
							link: '/en/common/html.html'
						},
						{
							text: 'Object',
							link: '/en/common/object.html'
						},
						{
							text: 'Path',
							link: '/en/common/path.html'
						},
						{
							text: 'Script',
							link: '/en/common/script.html'
						},
						{
							text: 'Validation',
							link: '/en/common/validation.html'
						}
					]
				},
				{
					text: 'Plugin Factory',
					items: [
						{
							text: 'Overview',
							link: '/en/factory/index.html'
						},
						{
							text: 'BasePlugin',
							link: '/en/factory/base-plugin.html'
						},
						{
							text: 'createPluginFactory',
							link: '/en/factory/create-plugin-factory.html'
						},
						{
							text: 'BasePluginOptions',
							link: '/en/factory/base-plugin-options.html'
						}
					]
				},
				{
					text: 'Logger',
					items: [
						{
							text: 'Overview',
							link: '/en/logger/index.html'
						},
						{
							text: 'Logger',
							link: '/en/logger/logger-class.html'
						},
						{
							text: 'PluginLogger',
							link: '/en/logger/plugin-logger.html'
						},
						{
							text: 'LoggerOptions',
							link: '/en/logger/logger-options.html'
						}
					]
				},
				{
					text: 'Plugins',
					items: [
						{
							text: 'Overview',
							link: '/en/plugins/index.html'
						},
						{
							text: 'buildProgress',
							link: '/en/plugins/build-progress.html'
						},
						{
							text: 'bundleAnalyzer',
							link: '/en/plugins/bundle-analyzer.html'
						},
						{
							text: 'compressAssets',
							link: '/en/plugins/compress-assets.html'
						},
						{
							text: 'copyFile',
							link: '/en/plugins/copy-file.html'
						},
						{
							text: 'faviconManager',
							link: '/en/plugins/favicon-manager.html'
						},
						{
							text: 'generateRouter',
							link: '/en/plugins/generate-router.html'
						},
						{
							text: 'generateVersion',
							link: '/en/plugins/generate-version.html'
						},
						{
							text: 'htmlInject',
							link: '/en/plugins/html-inject.html'
						},
						{
							text: 'loadingManager',
							link: '/en/plugins/loading-manager.html'
						},
						{
							text: 'versionUpdateChecker',
							link: '/en/plugins/version-update-checker.html'
						}
					]
				}
			]
		}
	}
}
