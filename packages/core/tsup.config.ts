import { defineConfig } from 'tsup'
import { resolve } from 'node:path'

export default defineConfig({
	entry: ['src/index.ts', 'src/plugins/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	clean: true,
	sourcemap: false,
	minify: false,
	external: ['vue'],
	treeshake: true,
	esbuildOptions(options) {
		options.alias = { '@': resolve('src') }
	}
})
