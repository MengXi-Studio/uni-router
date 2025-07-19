import { Route, RouteLocationRaw } from '@/type'

/**
 * 解析路由位置
 * @param location 路由位置
 * @returns 解析后的路径和查询参数
 */
export function parseLocation(location: RouteLocationRaw): { path: string; query?: Record<string, string> } {
	if (typeof location === 'string') {
		return { path: location }
	}
	return {
		path: location.path,
		query: location.query as Record<string, string>
	}
}

/**
 * 构建完整URL
 * @param path 路径
 * @param query 查询参数
 * @returns 完整URL字符串
 */
export function buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
	// 处理路径开头的斜杠
	const normalizedPath = path.startsWith('/') ? path : `/${path}`

	// tabBar页面不处理查询参数
	if (path.startsWith('tabBar/')) {
		return normalizedPath
	}

	// 如果路径已包含查询参数，直接返回
	if (path.includes('?')) {
		return normalizedPath
	}

	// 没有查询参数的情况
	if (!query) {
		return normalizedPath
	}

	// 构建查询字符串
	const queryStr = Object.keys(query)
		.filter(key => query[key] !== undefined && query[key] !== null)
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
		.join('&')

	return queryStr ? `${normalizedPath}?${queryStr}` : normalizedPath
}

/**
 * 获取当前路由信息
 * @param currentPage 当前页面实例
 * @returns 当前路由对象或null
 */
export function getCurrentRoute(currentPage: any): Route | null {
	if (!currentPage) {
		return null
	}

	// 使用条件编译处理多平台差异
	let options: Record<string, string> = {}

	// #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
	options = currentPage.options || {}
	// #endif

	// #ifdef H5
	options = currentPage.$vm?.$route?.query || {}
	// #endif

	// #ifdef APP-PLUS
	options = currentPage.$vm?.$mp?.query || {}
	// #endif

	return {
		path: currentPage.route || '',
		fullPath: buildUrl(currentPage.route || ''),
		query: options
	}
}
