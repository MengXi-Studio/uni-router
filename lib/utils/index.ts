import type { CurrentPage, Route, RouteLocationRaw } from '@/type'

/**
 * 解析路由位置，将传入的路由位置信息转换为统一的路径和查询参数格式
 * @param location 路由位置信息，可以是字符串类型的路径，也可以是包含路径和查询参数的对象
 * @returns 解析后的路径和可选的查询参数对象
 */
export function parseLocation(location: RouteLocationRaw): { path: string; query?: Record<string, string> } {
	// 如果传入的 location 是字符串类型，直接将其作为路径返回
	if (typeof location === 'string') {
		return { path: location }
	}

	// 若 location 是对象且包含 query 属性，将 query 转换为键值对均为字符串的对象
	const query = typeof location.query === 'object' && location.query !== null ? Object.fromEntries(Object.entries(location.query).map(([key, value]) => [key, String(value)])) : undefined

	return {
		path: location.path,
		query
	}
}

/**
 * 构建完整的 URL 字符串，根据传入的路径和查询参数生成最终的 URL
 * @param path 路径字符串
 * @param query 可选的查询参数对象，包含键值对
 * @returns 构建好的完整 URL 字符串
 */
export function buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
	// 提前处理 tabBar 页面，若路径以 'tabBar/' 开头，确保路径以 '/' 开头
	if (path.startsWith('tabBar/')) {
		return path.startsWith('/') ? path : `/${path}`
	}

	// 处理路径开头的斜杠，确保路径以 '/' 开头
	const normalizedPath = path.startsWith('/') ? path : `/${path}`

	// 如果路径中已经包含查询参数，直接返回处理后的路径
	if (path.includes('?')) {
		return normalizedPath
	}

	// 若没有传入查询参数，直接返回处理后的路径
	if (!query) {
		return normalizedPath
	}

	// 构建查询字符串，过滤掉值为 undefined 或 null 的参数，并对键值进行编码
	const queryStr = Object.keys(query)
		.filter(key => query[key] !== undefined && query[key] !== null)
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
		.join('&')

	// 如果查询字符串不为空，将其追加到路径后面，否则直接返回路径
	return queryStr ? `${normalizedPath}?${queryStr}` : normalizedPath
}

/**
 * 获取当前路由信息，根据传入的当前页面实例提取路由相关信息
 * @param currentPage 当前页面实例，可能为 null
 * @returns 当前路由对象，包含路径、完整路径和查询参数，若页面实例为 null 则返回 null
 */
export function getCurrentRoute(currentPage: CurrentPage | null): Route | null {
	// 若当前页面实例为 null，直接返回 null
	if (!currentPage) {
		return null
	}

	// 使用条件编译处理多平台差异，初始化查询参数对象
	let options: Record<string, string> = {}

	// 在微信小程序、支付宝小程序、百度小程序、头条小程序、QQ 小程序平台下，获取页面参数
	// #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
	options = currentPage.options || {}
	// #endif

	// 在 H5 平台下，从 Vue 实例的路由信息中获取查询参数
	// #ifdef H5
	options = currentPage.$vm?.$route?.query || {}
	// #endif

	// 在 App 平台下，从 Vue 实例的小程序相关信息中获取查询参数
	// #ifdef APP-PLUS
	options = currentPage.$vm?.$mp?.query || {}
	// #endif

	return {
		path: currentPage.route || '',
		fullPath: buildUrl(currentPage.route || ''),
		query: options
	}
}
