import type { RouteConfig } from '@/types'

/**
 * 路径 -> 路由配置 映射
 *
 * 用于按路径快速查找路由配置
 */
export type PathRouteMap = Map<string, RouteConfig>

/**
 * 名称 -> 路由配置 映射
 *
 * 用于按名称快速查找路由配置
 */
export type NameRouteMap = Map<string, RouteConfig>
