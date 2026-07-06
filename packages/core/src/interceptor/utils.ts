import type { NavigationAnimation, RouteLocationRaw, EventListeners } from '@/types'
import { normalizePath, parseQuery } from '@/utils/path'

/**
 * 解析 uni API 的 URL 为路径和查询参数
 *
 * @param url - uni API 传入的 URL，如 "/pages/about/about?id=1"
 * @returns 路径和查询参数
 */
export function parseUniUrl(url: string): { path: string; query: Record<string, string> } {
	if (!url) return { path: '', query: {} }

	const queryIndex = url.indexOf('?')
	const rawPath = queryIndex === -1 ? url : url.slice(0, queryIndex)
	const queryString = queryIndex === -1 ? '' : url.slice(queryIndex + 1)

	const path = normalizePath(rawPath)
	const query = queryString ? parseQuery(queryString) : {}

	return { path, query }
}

/**
 * 从 uni API 调用参数中提取动画配置
 *
 * uni.navigateTo / uni.navigateBack 支持 animationType 和 animationDuration 参数（仅 App 端），
 * 此函数将其转换为路由器的 NavigationAnimation 格式，以便在拦截器转发时保留动画配置。
 *
 * @param args - uni API 调用参数
 * @returns 动画配置，不存在时返回 undefined
 */
export function extractAnimationFromArgs(args: Record<string, any>): NavigationAnimation | undefined {
	if (!args.animationType) return undefined
	return { type: args.animationType, ...(args.animationDuration != null && { duration: args.animationDuration }) }
}

/**
 * 将路径、查询参数、动画配置和事件监听器合并为 RouteLocationRaw
 *
 * @param path - 页面路径
 * @param query - 查询参数
 * @param animation - 动画配置
 * @param events - 页面间通信事件监听器
 * @returns 路由位置对象
 */
export function buildLocation(path: string, query: Record<string, string>, animation?: NavigationAnimation, events?: EventListeners): RouteLocationRaw {
	const hasQuery = query && Object.keys(query).length > 0
	if (!hasQuery && !animation && !events) return path
	return { path, ...(hasQuery && { query }), ...(animation && { animation }), ...(events && { events }) }
}
