import type { RouteConfig, RouteLocation, RouteLocationRaw } from '@/types/route'

/**
 * 路由匹配器接口，负责路由的查找和解析
 */
export interface RouteMatcher {
	/** 获取所有已注册的路由配置 */
	getRoutes(): RouteConfig[]
	/** 检查是否存在指定名称的路由 */
	hasRoute(name: string): boolean
	/** 将原始路由位置解析为完整的 RouteLocation */
	resolve(location: RouteLocationRaw): RouteLocation
	/** 根据路径获取路由配置 */
	getRouteConfig(path: string): RouteConfig | undefined
}
