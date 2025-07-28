import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { copyFile } from './plugins'

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	},

	plugins: [
		dts({
			outDir: 'dist',
			cleanVueFileName: true,
			staticImport: true,
			copyDtsFiles: true,
			include: ['src/**/*.ts', 'src/**/*.vue'],
			insertTypesEntry: true,
			rollupTypes: true
		}),

		copyFile({
			sourceDir: resolve('src/components'),
			targetDir: resolve('dist/components')
		})
	],

	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es', 'cjs', 'umd'],
			name: 'MxRouter',
			fileName: (format, entryName) => `${entryName}.${format}.js`
		},

		rollupOptions: {
			external: ['vue', 'uni'],
			output: {
				globals: {
					vue: 'Vue',
					uni: 'uni'
				}
			}
		}
	}
})
