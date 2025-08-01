import { defineConfig } from 'vitepress'
import { zhSearch } from './zh'

if (process.env.NETLIFY) {
	console.log('Netlify build', process.env.CONTEXT)
}

const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

/**
 * Default slugification function
 */
export const slugify = (str: string): string =>
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

export const sharedConfig = defineConfig({
	title: 'Uni Router',

	markdown: {
		theme: {
			dark: 'one-dark-pro',
			light: 'github-light'
		},

		attrs: {
			leftDelimiter: '%{',
			rightDelimiter: '}%'
		},

		anchor: {
			slugify
		}
	},

	head: [
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/uni-router/logo.svg' }],
		['link', { rel: 'icon', type: 'image/png', href: '/uni-router/logo.png' }],
		['link', { rel: 'icon', href: '/uni-router/favicon.ico' }],

		['meta', { property: 'og:type', content: 'website' }],
		['meta', { property: 'og:title', content: 'Uni Router' }],

		['meta', { property: 'twitter:title', content: 'Uni Router' }],
		['meta', { property: 'twitter:card', content: 'summary_large_image' }],
		['meta', { property: 'twitter:description', content: 'A powerful and flexible routing library for uni-app' }],

		['meta', { name: 'algolia-site-verification', content: 'E1DF0100DF17E451' }]
	],

	themeConfig: {
		logo: '/logo.svg',
		outline: [2, 3],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/MengXi-Studio/uni-router' },
			{ icon: 'npm', link: 'https://www.npmjs.com/package/@meng-xi/uni-router' }
		],

		footer: {
			copyright: 'Copyright © 2025-present MengXi Studio',
			message: 'Released under the MIT License.'
		},

		editLink: {
			pattern: 'https://github.com/MengXi-Studio/Uni Router/tree/master/packages/docs/:path',
			text: 'Suggest changes'
		},

		search: {
			provider: 'algolia',
			options: {
				appId: '6CHPKYO393',
				apiKey: '17d8a3d4523d64f450cce8b36f30485c',
				indexName: 'Uni Router',
				locales: { ...zhSearch }
			}
		}
	}
})
