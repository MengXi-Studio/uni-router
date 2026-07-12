import type { NavigationFailure } from '../../js_sdk/index'
import type { TabBarItemProps } from './context'

/** TabBar 组件 Props 类型 */
export interface TabBarProps {
	/** 默认文字颜色 */
	color?: string
	/** 选中文字颜色 */
	selectedColor?: string
	/** 背景色 */
	bgColor?: string
	/** 顶部边框颜色：'black'（默认）或 'white' */
	borderStyle?: 'black' | 'white'
	/** 是否固定在底部 */
	fixed?: boolean
	/** 是否显示顶部边框 */
	border?: boolean
	/** fixed 时是否生成等高占位元素，避免内容被遮挡 */
	placeholder?: boolean
	/** 是否开启底部安全区适配 */
	safeAreaInsetBottom?: boolean
	/** 元素 z-index */
	zIndex?: number | string
	/** 切换前拦截器，返回 false 或 reject 可阻止切换；支持 Promise */
	beforeChange?: (item: TabBarItemProps, index: number) => boolean | Promise<boolean>
}

/** TabBar 组件 Emits 类型 */
export interface TabBarEmits {
	/** 点击 tab 切换成功后触发 */
	change: [item: TabBarItemProps, index: number]
	/** 导航失败时触发（如守卫中止、重复导航） */
	error: [error: NavigationFailure]
}
