import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate/generate-router'

export default defineConfig({
	plugins: [
		uni(),

		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			outputFormat: 'ts',
			nameStrategy: 'camelCase',
			includeSubPackages: true,
			watch: true,
			exportTypes: true,
			preserveRouteChanges: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			},
			headerTemplate: true,
			dts: true
		})
	],

	// vue-router 的 @dcloudio/vite-plugin-uni 强制映射到 esm-bundler.js 导致弃用警告，这里修正为正确的 mjs 入口
	resolve: {
		alias: {
			'vue-router': 'vue-router/dist/vue-router.mjs'
		}
	}
})
