import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/uni-router/zh/'
export const META_TITLE = 'Uni Router'
export const META_DESCRIPTION = '基于 Vue Router 的路由管理系统'

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
			pattern: 'https://github.com/MengXi-Studio/uni-router/tree/master/packages/docs/:path',
			text: '对本页提出修改建议'
		},

		/** 网站主题配置 大纲标题 */
		outlineTitle: '本页内容',

		/** 网站主题配置 导航栏 */
		nav: [
			{
				text: '公共工具',
				link: '/common/index.html'
			},
			{
				text: '插件工厂',
				link: '/factory/index.html'
			},
			{
				text: '日志模块',
				link: '/logger/index.html'
			},
			{
				text: '插件模块',
				link: '/plugins/index.html'
			},
			{
				text: '相关链接',
				items: [
					{
						text: 'Discussions',
						link: 'https://github.com/MengXi-Studio/vite-plugin/discussions'
					},
					{
						text: '更新日志',
						link: 'https://github.com/MengXi-Studio/uni-router/releases'
					}
				]
			}
		],

		/** 网站主题配置 侧边栏 */
		sidebar: {
			'/': [
				{
					text: '设置',
					items: [
						{
							text: '介绍',
							link: '/introduction.html'
						},
						{
							text: '安装',
							link: '/installation.html'
						}
					]
				},

				{
					text: '公共工具',
					items: [
						{
							text: '概览',
							link: '/common/index.html'
						},
						{
							text: '压缩算法',
							link: '/common/compress.html'
						},
						{
							text: '文件系统',
							link: '/common/fs.html'
						},
						{
							text: '格式化',
							link: '/common/format.html'
						},
						{
							text: 'HTML 注入',
							link: '/common/html.html'
						},
						{
							text: '对象操作',
							link: '/common/object.html'
						},
						{
							text: '路径处理',
							link: '/common/path.html'
						},
						{
							text: '脚本工具',
							link: '/common/script.html'
						},
						{
							text: '验证器',
							link: '/common/validation.html'
						}
					]
				},
				{
					text: '插件工厂',
					items: [
						{
							text: '概览',
							link: '/factory/index.html'
						},
						{
							text: 'BasePlugin',
							link: '/factory/base-plugin.html'
						},
						{
							text: 'createPluginFactory',
							link: '/factory/create-plugin-factory.html'
						},
						{
							text: 'BasePluginOptions',
							link: '/factory/base-plugin-options.html'
						}
					]
				},
				{
					text: '日志模块',
					items: [
						{
							text: '概览',
							link: '/logger/index.html'
						},
						{
							text: 'Logger',
							link: '/logger/logger-class.html'
						},
						{
							text: 'PluginLogger',
							link: '/logger/plugin-logger.html'
						},
						{
							text: 'LoggerOptions',
							link: '/logger/logger-options.html'
						}
					]
				},
				{
					text: '插件模块',
					items: [
						{
							text: '概览',
							link: '/plugins/index.html'
						},
						{
							text: 'buildProgress',
							link: '/plugins/build-progress.html'
						},
						{
							text: 'bundleAnalyzer',
							link: '/plugins/bundle-analyzer.html'
						},
						{
							text: 'compressAssets',
							link: '/plugins/compress-assets.html'
						},
						{
							text: 'copyFile',
							link: '/plugins/copy-file.html'
						},
						{
							text: 'faviconManager',
							link: '/plugins/favicon-manager.html'
						},
						{
							text: 'generateRouter',
							link: '/plugins/generate-router.html'
						},
						{
							text: 'generateVersion',
							link: '/plugins/generate-version.html'
						},
						{
							text: 'htmlInject',
							link: '/plugins/html-inject.html'
						},
						{
							text: 'loadingManager',
							link: '/plugins/loading-manager.html'
						},
						{
							text: 'versionUpdateChecker',
							link: '/plugins/version-update-checker.html'
						}
					]
				}
			]
		}
	}
}
