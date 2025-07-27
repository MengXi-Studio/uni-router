import { defineBuildConfig } from 'unbuild'
import path from 'path'

export default defineBuildConfig({
	entries: ['src/index'],
	alias: {
		'@': path.resolve(__dirname, 'src')
	},
	declaration: true,
	clean: true,
	externals: [/\.vue$/],
	rollup: {
		emitCJS: true,
		inlineDependencies: true
	}
})
