import { defineConfig } from 'vitepress'

/** 网站部署基础路径（CI 注入，本地默认 /uni-router/） */
const base = process.env.DOCS_BASE || '/uni-router/'

/** 将根路径资源拼接到当前 base 下，避免 v1 子路径下 favicon 等资源 404 */
const asset = (p: string) => base + p.replace(/^\//, '')

/**
 * 版本切换器导航项
 *
 * master 分支：v2 标为当前，v1 用绝对 URL
 * v1 分支切出后：改为 v1 标为当前，v2 用绝对 URL（link: '/' 在 v1 下会解析为 /uni-router/v1/）
 */
export const versionNav = {
	text: 'v1.9.0',
	items: [
		{ text: 'v2', link: 'https://mengxi-studio.github.io/uni-router/' },
		{ text: 'v1.9.0', link: '/' }
	]
}

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
		['link', { rel: 'icon', type: 'image/png', href: asset('logo.png') }],
		['link', { rel: 'icon', href: asset('favicon.ico') }],

		['meta', { property: 'og:type', content: 'website' }],
		['meta', { property: 'og:title', content: 'Uni Router' }],

		['meta', { property: 'twitter:title', content: 'Uni Router' }],
		['meta', { property: 'twitter:card', content: 'summary_large_image' }],
		['meta', { property: 'twitter:description', content: '为 uni-app 提供类似 vue-router 风格的路由管理系统' }]
	],

	/** 网站主题配置 */
	themeConfig: {
		/** 网站主题配置 logo（VitePress 自动拼 base，无需处理） */
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
