import { defineConfig, type PluginOption } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate-router'

export default defineConfig({
	plugins: [
		uni(),

		// 路由生成 + 类型声明
		generateRouter({
			pagesJsonPath: 'pages.json',
			outputPath: 'router.config.ts',
			dts: 'router.d.d.ts',
			fileHeader: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	] as PluginOption[]
})
