import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	},

	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => ['navigator'].includes(tag)
				}
			}
		}),

		dts({
			outDir: 'dist',
			cleanVueFileName: true,
			staticImport: true,
			copyDtsFiles: true,
			include: ['src/**/*.ts', 'src/**/*.vue'],
			insertTypesEntry: true,
			rollupTypes: true
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
			external: ['vue'],
			output: {
				globals: {
					vue: 'Vue'
				}
			}
		}
	}
})
