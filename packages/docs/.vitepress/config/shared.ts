import { defineConfig } from 'vitepress'

if (process.env.NETLIFY) {
	console.log('Netlify build', process.env.CONTEXT)
}

const rControl = /[\u0000-\u001F]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

/**
 * Default slugification function
 */
export function slugify(str: string): string {
	return (
		str
			.normalize('NFKD')
			// Remove accents
			.replace(rCombining, '')
			// Remove control characters
			.replace(rControl, '')
			// Replace special characters
			.replace(rSpecial, '-')
			// ensure it doesn't start with a number
			.replace(/^(\d)/, '_$1')
	)
}

export const sharedConfig = defineConfig({
	/** 网站标题 */
	title: 'Uni Router',

	/** 网站 Markdown 配置 */
	markdown: {
		/** 网站 Markdown 主题 */
		theme: {
			dark: 'one-dark-pro',
			light: 'github-light'
		},

		/** 网站 Markdown 属性 */
		attrs: {
			leftDelimiter: '%{',
			rightDelimiter: '}%'
		},

		/** 网站 Markdown 锚点 */
		anchor: {
			slugify
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
		/** 网站主题配置 导航栏 */
		outline: [2, 3],

		/** 网站主题配置 社交链接 */
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/MengXi-Studio/uni-router' },
			{ icon: 'npm', link: 'https://www.npmjs.com/package/@meng-xi/uni-router' }
		],

		/** 网站主题配置 页脚 */
		footer: {
			copyright: 'Copyright © 2025-present 梦曦工作室',
			message: 'Released under the MIT License.'
		},

		/** 网站主题配置 编辑链接 */
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/uni-router/tree/master/packages/docs/:path',
			text: 'Suggest changes'
		}
	}
})
