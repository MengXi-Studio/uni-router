import { defineConfig } from 'vitepress'
import { sharedConfig } from './shared'
import { zhConfig } from './zh'
import { enConfig } from './en'

export default defineConfig({
	...sharedConfig,

	/** 网站部署基础路径 */
	base: '/uni-router/',

	/** 文档源目录 */
	srcDir: './src',

	/** 网站支持的语言 */
	locales: {
		root: { label: '简体中文', lang: 'zh-CN', link: '/', ...zhConfig },
		en: { label: 'English', lang: 'en-US', link: '/en/', ...enConfig }
	}
})
