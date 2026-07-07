import { defineConfig } from 'vitepress'
import { sharedConfig } from './shared'
import { zhConfig } from './zh'
import { enConfig } from './en'

export default defineConfig({
	...sharedConfig,

	/**
	 * 网站部署基础路径
	 *
	 * CI 通过 DOCS_BASE 环境变量注入：
	 * - master 分支：/uni-router/
	 * - v1 分支：/uni-router/v1/
	 * 本地开发默认 /uni-router/
	 */
	base: process.env.DOCS_BASE || '/uni-router/',

	/** 文档源目录 */
	srcDir: './src',

	/** 网站支持的语言 */
	locales: {
		root: { label: '简体中文', lang: 'zh-CN', link: '/', ...zhConfig },
		en: { label: 'English', lang: 'en-US', link: '/en/', ...enConfig }
	}
})
