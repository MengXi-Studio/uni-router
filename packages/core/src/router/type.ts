import type { RouteLocationRaw } from '@/types/route'
import type { NavigationPrepareContext, NavigationCompleteContext } from '@/types/plugin'
import type { createRouteState } from '@/state'
import type { App } from 'vue'

/**
 * 路由状态管理器的类型（从 createRouteState 工厂函数推导）
 */
export type RouteState = ReturnType<typeof createRouteState>

/**
 * 路由同步模块接口
 */
export interface RouteSync {
	/** 同步路由状态与实际页面栈（去重：path + query 相同则跳过） */
	syncRoute(): void
	/** 根据 uni-app 实际页面栈同步 currentRoute 状态（强制同步，不做去重） */
	syncCurrentRoute(): void
}

/**
 * 在 matcher.resolve() 前增强原始路由位置
 */
export type EnrichLocationHook = (location: RouteLocationRaw) => RouteLocationRaw

/**
 * resolve 之后、守卫之前，从增强后的路由位置中提取插件数据
 */
export type AfterResolveHook = (enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>) => void

/**
 * uni API 调用前，修改导航 URL query 和选项
 */
export type PrepareNavigationHook = (ctx: NavigationPrepareContext) => void

/**
 * uni API 调用成功后，扩展 NavigationResult
 */
export type CompleteNavigationHook = (ctx: NavigationCompleteContext) => void

/**
 * 导航中止或失败时，执行清理操作
 */
export type NavigationAbortHook = (pluginData: Record<string, any>) => void

/**
 * syncCurrentRoute 期间，从 URL query 中提取插件数据
 */
export type RouteSyncHook = (query: Record<string, string>, params: Record<string, any>) => void

/**
 * router.install() 被调用时触发
 */
export type AppInstallHook = (app: App) => void
