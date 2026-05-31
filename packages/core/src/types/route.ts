import type { NavigationGuard } from './guard'

/**
 * 路由元信息，用于描述路由的附加属性
 */
export interface RouteMeta {
	/** 页面标题 */
	title?: string
	/** 是否为 TabBar 页面 */
	isTab?: boolean
	/** 是否需要登录认证 */
	requireAuth?: boolean
	/** 自定义扩展字段 */
	[key: string]: unknown
}

/**
 * 路由配置项，对应 pages.json 中的页面声明
 */
export interface RouteConfig {
	/** 页面路径，需与 pages.json 中的路径一致 */
	path: string
	/** 路由名称，用于命名路由导航 */
	name?: string
	/** 路由元信息 */
	meta?: RouteMeta
	/** 路由独享守卫，进入该路由时触发 */
	beforeEnter?: NavigationGuard | NavigationGuard[]
}

/**
 * 解析后的路由位置信息
 */
export interface RouteLocation {
	/** 规范化后的路径 */
	path: string
	/** 路由名称 */
	name?: string
	/** 路由元信息 */
	meta: RouteMeta
	/** 查询参数 */
	query: Record<string, string>
	/** 完整路径（含查询参数） */
	fullPath: string
}

/**
 * 基于路径的原始路由位置
 */
export interface RouteLocationPathRaw {
	/** 目标路径 */
	path: string
	/** 查询参数 */
	query?: Record<string, string>
}

/**
 * 基于名称的原始路由位置
 */
export interface RouteLocationNamedRaw {
	/** 目标路由名称 */
	name: string
	/** 查询参数 */
	query?: Record<string, string>
}

/**
 * 原始路由位置，支持路径字符串、路径对象或命名对象
 */
export type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
