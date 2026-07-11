import type { RouterPlugin, PluginContext } from '@/plugin'
import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw, RouterOptions, ParamObject } from '@/types'
import { PARAMS_KEY } from './params-manager'
import type { ParamsManager } from './params-manager'

// Re-export implementation code for external use
export { PARAMS_KEY, createParamsManager } from './params-manager'
export type { ParamsManager } from './params-manager'

/**
 * ParamsPlugin 插件数据键
 */
const PLUGIN_DATA_KEY = 'params'

/**
 * 从原始路由位置中提取 params 和 persistent，存入 ParamsManager 并将 key 注入 location
 */
function enrichLocationWithParams(location: RouteLocationRaw, paramsManager: ParamsManager): RouteLocationRaw {
	if (typeof location === 'string') return location

	// 检查是否有 params（通过模块增强的字段）
	const loc = location as Record<string, any>
	const hasParams = 'params' in loc && loc.params
	if (!hasParams || Object.keys(loc.params).length === 0) return location

	const params = loc.params as ParamObject
	const persistent = 'persistent' in loc ? loc.persistent : undefined
	const key = paramsManager.set(params, persistent)

	// 将 key 注入 query
	if ('path' in location) {
		const pathLoc = location as RouteLocationPathRaw
		return {
			...pathLoc,
			query: { ...pathLoc.query, [PARAMS_KEY]: key }
		}
	}

	if ('name' in location) {
		const namedLoc = location as RouteLocationNamedRaw
		return {
			...namedLoc,
			query: { ...namedLoc.query, [PARAMS_KEY]: key }
		}
	}

	return location
}

/**
 * 从已注入 params key 的路由位置中提取 __params_key
 */
function extractParamsKey(location: RouteLocationRaw): string | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'query' in location) {
		const query = (location as { query?: Record<string, unknown> }).query
		return query?.[PARAMS_KEY] as string | undefined
	}
	return undefined
}

/**
 * ParamsPlugin - 页面参数管理插件
 *
 * 提供 params 传递和存储能力：
 * - 将页面参数存入 ParamsManager，通过 URL query 中的 __params_key 关联
 * - 支持内存存储和 storage 持久化两种模式
 * - syncCurrentRoute 时从 URL 中提取 __params_key 重建 params
 */
export const ParamsPlugin: RouterPlugin = {
	name: 'params',

	install(context: PluginContext, options: RouterOptions) {
		// 使用核心共享的 ParamsManager 实例，并根据 options 更新默认持久化策略
		const paramsManager = context.paramsManager
		const persistent = options.paramsPersistent ?? false
		if (persistent) {
			paramsManager.setDefaultPersistent(persistent)
		}

		// onEnrichLocation: 在 resolve 前将 params 存入 ParamsManager 并将 key 注入 location
		context.onEnrichLocation(location => {
			return enrichLocationWithParams(location, paramsManager)
		})

		// onAfterResolve: 从 enrichedLocation 中提取 paramsKey，存入 pluginData
		context.onAfterResolve((enrichedLocation, pluginData) => {
			const paramsKey = extractParamsKey(enrichedLocation)
			if (paramsKey) {
				pluginData[PLUGIN_DATA_KEY] = { paramsKey }
			}
		})

		// onPrepareNavigation: 将 __params_key 拼入导航 URL query
		context.onPrepareNavigation(ctx => {
			const data = ctx.pluginData[PLUGIN_DATA_KEY]
			if (data?.paramsKey) {
				ctx.query[PARAMS_KEY] = data.paramsKey
			}
		})

		// onRouteSync: 从 URL query 中提取 __params_key，重建 params
		context.onRouteSync((query, params) => {
			const paramsKey = query[PARAMS_KEY]
			if (paramsKey) {
				const resolved = paramsManager.peek(decodeURIComponent(paramsKey))
				if (resolved) {
					Object.assign(params, resolved)
				}
				// 从用户可见的 query 中移除内部 key
				delete query[PARAMS_KEY]
			}
		})
	}
}
