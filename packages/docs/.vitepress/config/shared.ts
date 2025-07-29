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
	title: 'uni-router',
	appearance: 'dark',

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
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
		['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],

		[
			'meta',
			{
				property: 'og:type',
				content: 'website'
			}
		],

		[
			'meta',
			{
				property: 'twitter:card',
				content: 'summary_large_image'
			}
		]
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
			pattern: 'https://github.com/MengXi-Studio/uni-router/tree/master/packages/docs/:path',
			text: 'Suggest changes'
		},

		search: {
			provider: 'algolia',
			options: {
				appId: '6CHPKYO393',
				apiKey: '17d8a3d4523d64f450cce8b36f30485c',
				indexName: 'uni-router',
				locales: { ...zhSearch }
			}
		}
	}
})
