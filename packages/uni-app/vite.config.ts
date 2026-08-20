import { defineConfig, type PluginOption } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from './uni_modules/vite-plugin/js_sdk/plugins/generate/generateRouter/index.mjs'

export default defineConfig({
	plugins: [
		uni(),

		// 路由生成 + 类型声明
		generateRouter({
			pagesJsonPath: 'pages.json',
			outputPath: 'router.config.ts',
			dts: 'router.d.d.ts',
			headerTemplate: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	] as PluginOption[],

	// vue-router 的 @dcloudio/vite-plugin-uni 强制映射到 esm-bundler.js 导致弃用警告，这里修正为正确的 mjs 入口
	resolve: {
		alias: {
			'vue-router': 'vue-router/dist/vue-router.mjs'
		}
	}
})
