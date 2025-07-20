import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

/**
 * Vite 配置文件，用于定义项目构建和开发服务器的相关配置。
 * 此配置主要针对库项目，包含类型声明生成、路径别名配置和构建配置等。
 */
export default defineConfig({
	// 配置路径别名，方便在代码中使用简洁的路径导入模块
	resolve: {
		alias: {
			// 将 @ 指向项目的 src 目录，可根据实际情况调整
			'@': resolve(__dirname, 'src')
		}
	},

	// 插件配置，用于扩展 Vite 的功能
	plugins: [
		dts({
			// 指定类型声明文件输出目录
			outDir: 'types',
			// 构建时清除旧的类型声明文件
			cleanVueFileName: true,
			// 静态导入图片等资源
			staticImport: true,
			// 生成后删除 src 目录下的类型声明文件
			copyDtsFiles: true,
			// 指定需要生成类型声明的文件
			include: ['src/**/*.ts'],
			// 自动生成入口文件
			insertTypesEntry: true,
			// 移除 lib 目录结构
			rollupTypes: true
		})
	],

	// 构建配置，用于配置项目的构建行为
	build: {
		// 库模式配置，用于构建库文件
		lib: {
			// 入口文件配置，可指定多个入口生成不同的构建产物
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
				router: resolve(__dirname, 'src/router/index.ts'),
				utils: resolve(__dirname, 'src/utils/index.ts')
			},
			// 输出文件名格式，根据不同的构建格式和入口名称生成对应的文件名
			fileName: (format, entryName) => `${entryName}.${format}.js`
		}
	}
})
