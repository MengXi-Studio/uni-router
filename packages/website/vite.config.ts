import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'
import { injectIco, copyFile } from './plugins'

function resolve(dir: string) {
	return path.resolve(__dirname, dir)
}

export default defineConfig(config => {
	return {
		define: {},

		/** 过滤掉 null 值 */
		plugins: [
			uni(),

			AutoImport({
				/** 自动导入 uni-app、vue、pinia 相关 API */
				imports: ['uni-app', 'vue', 'pinia'],
				/** 生成自动导入的声明文件 */
				dts: 'src/types/auto-imports.d.ts',
				/** 自动导入目录下的文件 */
				dirs: ['src/hooks/**', 'src/stores/**', 'src/utils/**'],
				/** 声明文件生成位置和文件名称 */
				vueTemplate: true
			}),

			injectIco('/static/'),

			copyFile({
				sourceDir: resolve('dist/build/h5'),
				targetDir: resolve('../../website')
			})
		],

		resolve: {
			alias: {
				'@': resolve('src'),
				'~': resolve('src')
			}
		},

		css: {
			preprocessorOptions: {
				scss: {
					silenceDeprecations: ['legacy-js-api'],
					javascriptEnabled: true,
					additionalData: `@use "@/styles/mixin.scss" as *;`
				}
			}
		}
	}
})
