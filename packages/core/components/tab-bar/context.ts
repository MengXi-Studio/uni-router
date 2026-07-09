import type { ComputedRef, InjectionKey } from 'vue'
import type { NavigationFailure, RouteLocationRaw } from '@meng-xi/uni-router'

/**
 * TabBar 单项配置（与 TabBarItem 组件 props 一致）
 *
 * 字段命名贴近 pages.json 的 tabBar.list，便于迁移；
 * `to` 复用路由库的 RouteLocationRaw，与 RouterLink 保持一致。
 */
export interface TabBarItemProps {
	/** 目标路由位置，支持路径字符串或路由对象，与 RouterLink 的 to 一致 */
	to: RouteLocationRaw
	/** Tab 文字 */
	text?: string
	/** 默认图标路径（相对路径或绝对路径） */
	iconPath?: string
	/** 选中图标路径，未设置时回退到 iconPath */
	selectedIconPath?: string
	/** 是否显示图标右上角小红点（优先级高于 badge） */
	dot?: boolean
	/** 图标右上角徽标内容（数字或字符串），为 0 / 空时不显示 */
	badge?: number | string
	/** 徽标数字上限，超过时显示 `${max}+`（仅对数字 badge 生效） */
	badgeMax?: number
	/** 徽标背景色，默认使用主题红色 */
	badgeColor?: string
	/** 是否使用替换模式导航（对应 router.replace） */
	replace?: boolean
}

/**
 * TabBar 父子组件通信上下文
 *
 * 父组件 provide，子组件 inject。active 状态由父组件从路由派生后下发，
 * 子组件仅负责渲染与点击导航，避免多处订阅路由。
 */
export interface TabBarContext {
	/** 选中文字颜色 */
	selectedColor: ComputedRef<string>
	/** 默认文字颜色 */
	color: ComputedRef<string>
	/** 当前路由路径（用于 path 维度匹配） */
	activePath: ComputedRef<string>
	/** 当前路由名称（用于 name 维度匹配） */
	activeName: ComputedRef<string | undefined>
	/** 切换前拦截器，返回 false 或 reject 阻止切换 */
	beforeChange: ComputedRef<((item: TabBarItemProps, index: number) => boolean | Promise<boolean>) | undefined>
	/** 注册子项，返回当前索引（用于 change 事件回传 index） */
	register: (uid: number) => number
	/** 注销子项 */
	unregister: (uid: number) => void
	/** 查询子项索引（响应式，随注册列表变化重算） */
	indexOf: (uid: number) => number
	/** 通知父组件切换成功 */
	notifyChange: (item: TabBarItemProps, index: number) => void
	/** 通知父组件导航失败 */
	notifyError: (error: NavigationFailure) => void
}

export const TABBAR_KEY: InjectionKey<TabBarContext> = Symbol('mx-tabbar')
