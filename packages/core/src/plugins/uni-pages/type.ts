import type { LoadConfigSource } from 'unconfig'
import { PagesConfig } from './types'

export type ConfigSource = string | LoadConfigSource<PagesConfig> | LoadConfigSource<PagesConfig>[]

/** 插件选项 */
export interface UniPagesOptions {
	/**
	 * @description 为路由地址生成类型定义文件
	 *
	 * @type {Boolean|String} 接受布尔值或与相对项目根目录的路径
	 *
	 * 为 true 时，默认值为 uni-pages.d.ts
	 * 为 false 时，不生成类型定义文件
	 * 为字符串时，指定类型定义文件的路径
	 *
	 * @default true
	 */
	dts?: boolean | string
	/**
	 * 配置文件
	 *
	 * @default 'pages.config.(ts|mts|cts|js|cjs|mjs|json)'
	 */
	configSource: ConfigSource
}
