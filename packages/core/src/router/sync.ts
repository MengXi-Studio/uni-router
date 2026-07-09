import type { RouteMeta, ParamObject } from '@/types'
import type { createRouteState } from '@/state'
import type { RouteMatcher } from '@/matcher'
import type { ParamsManager } from '@/params'
import { PARAMS_KEY } from '@/params'
import { NAV_ID_KEY } from '@/channel'
import { getCurrentPagePath, getCurrentPageQuery } from '@/navigation/context'
import { buildFullPath, createRouteLocation } from '@/utils'
import { isSameQuery } from '@/utils/query'

/** 路由状态管理器的类型（从 createRouteState 工厂函数推导） */
type RouteState = ReturnType<typeof createRouteState>

/** 路由同步模块接口 */
export interface RouteSync {
	/** 同步路由状态与实际页面栈（去重：path + query 相同则跳过） */
	syncRoute(): void
	/** 根据 uni-app 实际页面栈同步 currentRoute 状态（强制同步，不做去重） */
	syncCurrentRoute(): void
}

/**
 * 创建路由同步模块
 *
 * 负责将路由器的 currentRoute 与 uni-app 实际页面栈保持一致。
 * 当页面通过浏览器后退、物理返回键等非路由器方式切换时，
 * 路由器的 currentRoute 可能与实际页面不同步，调用 syncRoute 可校正。
 *
 * @param routeState - 路由状态管理器
 * @param matcher - 路由匹配器
 * @param paramsManager - Params 管理器
 * @returns 路由同步方法集合
 */
export function createRouteSync(routeState: RouteState, matcher: RouteMatcher, paramsManager: ParamsManager): RouteSync {
	/**
	 * 同步路由状态与实际页面栈
	 *
	 * 若当前页面与路由状态一致（路径和查询参数均相同），无需更新。
	 * 同步时清理无效 params（页面已不在栈中）。
	 */
	function syncRoute(): void {
		const from = routeState.getCurrentRoute()
		const currentPath = getCurrentPagePath()
		const currentQuery = getCurrentPageQuery()
		// 若当前页面与路由状态一致（路径和查询参数均相同），无需更新
		if (currentPath === from.path && isSameQuery(currentQuery, from.query)) return
		syncCurrentRoute()
		// 同步时清理无效 params
		paramsManager.cleanupStale()
	}

	/**
	 * 根据 uni-app 实际页面栈同步 currentRoute 状态
	 *
	 * 从页面栈中读取当前页面信息来更新路由状态。
	 * 状态同步不是一次完整的导航（未经过前置守卫），因此不触发 afterEach 钩子，
	 * 仅通知 onRouteChange 监听器。
	 *
	 * 从 query 中提取 __params_key 并读取 params，同时移除内部 key（不暴露给用户）。
	 * 使用 peek：syncCurrentRoute 在 back() 后调用，此时目标页面已在栈中，
	 * 但 get 的惰性清理可能在某些边界情况下误删，peek 更安全。
	 */
	function syncCurrentRoute(): void {
		const currentPath = getCurrentPagePath()
		const config = matcher.getRouteConfig(currentPath)
		const meta: RouteMeta = config?.meta ?? {}
		const query = getCurrentPageQuery()

		// 从 query 中提取 __params_key 并读取 params，同时移除内部 key（不暴露给用户）
		let params: ParamObject = {}
		const paramsKey = query[PARAMS_KEY]
		if (paramsKey) {
			const resolved = paramsManager.peek(decodeURIComponent(paramsKey))
			if (resolved) params = resolved
			// 从用户可见的 query 中移除内部 key，fullPath 也基于清理后的 query 构建
			delete query[PARAMS_KEY]
		}

		// 从 query 中提取 __nav_id 并写入 params.__navId，供 usePageChannel() 读取
		const navId = query[NAV_ID_KEY]
		if (navId) {
			params.__navId = decodeURIComponent(navId)
			delete query[NAV_ID_KEY]
		}

		const fullPath = buildFullPath(currentPath, query)
		const to = createRouteLocation({ path: currentPath, name: config?.name, meta, query, fullPath, params, _synced: true })
		routeState.setCurrentRoute(to)
	}

	return { syncRoute, syncCurrentRoute }
}
