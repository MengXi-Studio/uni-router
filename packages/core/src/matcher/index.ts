import type { RouteConfig, RouteLocation, RouteLocationNamedRaw, RouteLocationPathRaw, RouteLocationRaw, RouteMeta, ParamObject } from '@/types/route'
import { RouterErrorCode } from '@/types/error'
import { RouterError } from '@/errors'
import { buildFullPath, parseQuery, normalizePath, createRouteLocation, serializeQuery } from '@/utils'
import { warn, isObject } from '@/utils/general'
import type { ParamsManager } from '@/plugins/params/params-manager'
import { PARAMS_KEY } from '@/plugins/params/params-manager'

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
export function createRouteMatcher(routes: RouteConfig[], strict: boolean, paramsManager: ParamsManager): RouteMatcher {
	const pathMap: Map<string, RouteConfig> = new Map()
	const nameMap: Map<string, RouteConfig> = new Map()
	const routeList: RouteConfig[] = []

	for (const route of routes) {
		if (route.name && nameMap.has(route.name)) {
			warn(`Duplicate route name "${route.name}" detected. The later one will overwrite the previous.`)
		}
		const normalizedPath = normalizePath(route.path)
		if (pathMap.has(normalizedPath)) {
			warn(`Duplicate route path "${normalizedPath}" detected. The later one will overwrite the previous.`)
		}
		pathMap.set(normalizedPath, route)
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
		return pathMap.get(normalizePath(path))
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

		// 从 query 中提取 __params_key 并读取 params
		const params = extractParams(query)

		return createRouteLocation({
			path: normalizedPath,
			name: config?.name,
			meta,
			query,
			fullPath: buildFullPath(normalizedPath, query),
			params
		})
	}

	/**
	 * 从路径对象解析路由位置
	 * @param location - 包含 path 和可选 query 的路由位置对象
	 */
	function resolveFromPathRaw(location: RouteLocationPathRaw): RouteLocation {
		const normalizedPath = normalizePath(location.path)
		const config = pathMap.get(normalizedPath)
		const query = serializeQuery(location.query)
		const meta: RouteMeta = config?.meta ?? {}

		// 从 query 中提取 __params_key 并读取 params
		const params = extractParams(query)

		return createRouteLocation({
			path: normalizedPath,
			name: config?.name,
			meta,
			query,
			fullPath: buildFullPath(normalizedPath, query),
			params
		})
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
			const query = serializeQuery(location.query)
			const path = `/${location.name}`
			const params = extractParams(query)
			return createRouteLocation({
				path,
				meta: {},
				query,
				fullPath: buildFullPath(path, query),
				params
			})
		}

		const query = serializeQuery(location.query)
		const resolvedPath = normalizePath(config.path)
		const params = extractParams(query)
		return createRouteLocation({
			path: resolvedPath,
			name: config.name,
			meta: config.meta ?? {},
			query,
			fullPath: buildFullPath(resolvedPath, query),
			params
		})
	}

	/**
	 * 从 query 中提取 __params_key，并从 ParamsManager 读取 params
	 * 提取后从 query 中移除内部 key，避免暴露给用户
	 *
	 * 使用 peek 而非 get，因为 resolve 在导航执行前调用，
	 * 此时目标页面尚未入栈，get 的惰性清理会误删 params。
	 *
	 * 注意：__nav_id 的提取已移至 ChannelPlugin 的 routeSync hook
	 */
	function extractParams(query: Record<string, string>): ParamObject | undefined {
		const params: ParamObject = {}

		// 提取 __params_key 并读取存储的 params
		const key = query[PARAMS_KEY]
		if (key) {
			delete query[PARAMS_KEY]
			const stored = paramsManager.peek(decodeURIComponent(key))
			if (stored) Object.assign(params, stored)
		}

		return Object.keys(params).length > 0 ? params : undefined
	}

	return {
		getRoutes,
		hasRoute,
		resolve,
		getRouteConfig
	}
}
