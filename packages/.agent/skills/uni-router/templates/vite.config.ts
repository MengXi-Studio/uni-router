// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin/plugins/generate/generate-router'
// 也可从包入口引入：import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			outputFormat: 'ts', // 'ts' | 'js'
			nameStrategy: 'camelCase', // 'path' | 'camelCase' | 'pascalCase' | 'custom'
			// customNameGenerator: (p) => p.replace(/\//g, '-'),  // nameStrategy: 'custom' 时必填
			includeSubPackages: true,
			watch: true, // 开发模式下监听 pages.json 自动重新生成
			exportTypes: true,
			preserveRouteChanges: true, // 保留手写的 beforeEnter 等改动
			metaMapping: {
				navigationBarTitleText: 'title', // 自定义会覆盖默认，需一并写回
				requireAuth: 'requireAuth'
			},
			headerTemplate: true,
			dts: true // 生成 src/router.d.ts（RouteNameMap），获得路由名类型提示
		})
	]
})
