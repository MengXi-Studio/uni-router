import type { RouteConfig, RouteLocation, RouteLocationNamedRaw, RouteLocationPathRaw, RouteLocationRaw, RouteMeta } from '@/types/route'
import { RouterErrorCode } from '@/types/error'
import { RouterError } from '@/errors'
import { buildFullPath, parseQuery, normalizePath } from '@/utils/path'
import { warn, isObject } from '@/utils/general'

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

/**
 * 创建路由匹配器实例
 * @param routes - 路由配置列表
 * @param strict - 是否启用严格模式
 * @returns 路由匹配器实例
 */
export function createRouteMatcher(routes: RouteConfig[], strict: boolean): RouteMatcher {
	const pathMap: Map<string, RouteConfig> = new Map()
	const nameMap: Map<string, RouteConfig> = new Map()
	const routeList: RouteConfig[] = []

	for (const route of routes) {
		if (route.name && nameMap.has(route.name)) {
			warn(`Duplicate route name "${route.name}" detected. The later one will overwrite the previous.`)
		}
		pathMap.set(route.path, route)
		if (route.name) {
			nameMap.set(route.name, route)
		}
		routeList.push(route)
	}

	/**
	 * 获取所有路由配置的浅拷贝
	 */
	function getRoutes(): RouteConfig[] {
		return [...routeList]
	}

	/**
	 * 检查是否存在指定名称的路由
	 * @param name - 路由名称
	 */
	function hasRoute(name: string): boolean {
		return nameMap.has(name)
	}

	/**
	 * 根据路径获取路由配置
	 * @param path - 页面路径
	 */
	function getRouteConfig(path: string): RouteConfig | undefined {
		return pathMap.get(path)
	}

	/**
	 * 将原始路由位置解析为 RouteLocation
	 * @param location - 原始路由位置
	 * @throws {RouterError} 严格模式下未找到路由时抛出
	 */
	function resolve(location: RouteLocationRaw): RouteLocation {
		if (typeof location === 'string') {
			return resolveFromPath(location)
		}
		if (isObject(location)) {
			if ('name' in location) {
				return resolveFromName(location as RouteLocationNamedRaw)
			}
			if ('path' in location) {
				return resolveFromPathRaw(location as RouteLocationPathRaw)
			}
		}
		throw new RouterError(RouterErrorCode.ROUTE_NOT_FOUND, `Invalid route location: ${JSON.stringify(location)}`)
	}

	/**
	 * 从路径字符串解析路由位置
	 * @param path - 可包含查询参数的路径字符串
	 */
	function resolveFromPath(path: string): RouteLocation {
		const queryIndex = path.indexOf('?')
		const rawPath = queryIndex === -1 ? path : path.slice(0, queryIndex)
		const queryString = queryIndex === -1 ? '' : path.slice(queryIndex + 1)
		const normalizedPath = normalizePath(rawPath)
		const config = pathMap.get(normalizedPath)
		const query = queryString ? parseQuery(queryString) : {}
		const meta: RouteMeta = config?.meta ?? {}

		return {
			path: normalizedPath,
			name: config?.name,
			meta,
			query,
			fullPath: buildFullPath(normalizedPath, query)
		}
	}

	/**
	 * 从路径对象解析路由位置
	 * @param location - 包含 path 和可选 query 的路由位置对象
	 */
	function resolveFromPathRaw(location: RouteLocationPathRaw): RouteLocation {
		const normalizedPath = normalizePath(location.path)
		const config = pathMap.get(normalizedPath)
		const query = location.query ?? {}
		const meta: RouteMeta = config?.meta ?? {}

		return {
			path: normalizedPath,
			name: config?.name,
			meta,
			query,
			fullPath: buildFullPath(normalizedPath, query)
		}
	}

	/**
	 * 从路由名称解析路由位置
	 * @param location - 包含 name 和可选 query 的路由位置对象
	 * @throws {RouterError} 严格模式下未找到路由名称时抛出
	 */
	function resolveFromName(location: RouteLocationNamedRaw): RouteLocation {
		const config = nameMap.get(location.name)
		if (!config) {
			if (strict) {
				throw new RouterError(RouterErrorCode.ROUTE_NOT_FOUND, `Route name "${location.name}" not found`)
			}
			warn(`Route name "${location.name}" not found`)
			const query = location.query ?? {}
			const path = `/${location.name}`
			return {
				path,
				meta: {},
				query,
				fullPath: buildFullPath(path, query)
			}
		}

		const query = location.query ?? {}
		return {
			path: config.path,
			name: config.name,
			meta: config.meta ?? {},
			query,
			fullPath: buildFullPath(config.path, query)
		}
	}

	return {
		getRoutes,
		hasRoute,
		resolve,
		getRouteConfig
	}
}
