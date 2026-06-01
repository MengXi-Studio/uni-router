import { defineConfig } from 'vitepress'

export const sharedConfig = defineConfig({
	/** 网站标题 */
	title: 'Uni Router',

	lastUpdated: true,

	markdown: {
		/** 网站 Markdown 主题 */
		theme: {
			dark: 'one-dark-pro',
			light: 'github-light'
		}
	},

	/** 网站头标签 */
	head: [
		['link', { rel: 'icon', type: 'image/png', href: '/uni-router/logo.png' }],
		['link', { rel: 'icon', href: '/uni-router/favicon.ico' }],

		['meta', { property: 'og:type', content: 'website' }],
		['meta', { property: 'og:title', content: 'Uni Router' }],

		['meta', { property: 'twitter:title', content: 'Uni Router' }],
		['meta', { property: 'twitter:card', content: 'summary_large_image' }],
		['meta', { property: 'twitter:description', content: '为 uni-app 提供类似 vue-router 风格的路由管理系统' }]
	],

	/** 网站主题配置 */
	themeConfig: {
		/** 网站主题配置 logo */
		logo: '/logo.png',

		/** 网站主题配置 社交链接 */
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/MengXi-Studio/uni-router' },
			{ icon: 'npm', link: 'https://www.npmjs.com/package/@meng-xi/uni-router' }
		],

		/** 网站主题配置 页脚 */
		footer: {
			copyright: 'Copyright © 2026-present 梦曦工作室',
			message: 'Released under the MIT License.'
		}
	}
})
