import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
	plugins: [
		dts({
			// 指定类型声明文件输出目录
			outDir: 'types',
			// 构建时清除旧的类型声明文件
			cleanVueFileName: true,
			// 静态导入图片等资源
			staticImport: true,
			// 生成后删除 src 目录下的类型声明文件
			copyDtsFiles: true
		})
	],
	build: {
		lib: {
			entry: {
				index: resolve(__dirname, 'lib/index.ts'),
				router: resolve(__dirname, 'lib/router/index.ts'),
				utils: resolve(__dirname, 'lib/utils/index.ts')
			},
			name: 'MxRouter',
			fileName: (format, entryName) => `${entryName}.${format}.js`
		}
	}
})
