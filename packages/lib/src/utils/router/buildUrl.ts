/**
 * 构建完整的 URL 字符串，根据传入的路径和查询参数生成最终的 URL
 * @param path 路径字符串
 * @param query 可选的查询参数对象，包含键值对，值的类型可以是字符串、数字或布尔值
 * @returns 构建好的完整 URL 字符串
 */
export function buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
	// 提前处理 tabBar 页面，若路径以 'tabBar/' 开头，确保路径以 '/' 开头
	if (path.startsWith('tabBar/')) {
		// 若路径已经以 '/' 开头则直接返回，否则在路径前添加 '/'
		return path.startsWith('/') ? path : `/${path}`
	}

	// 处理路径开头的斜杠，确保路径以 '/' 开头
	const normalizedPath = path.startsWith('/') ? path : `/${path}`

	// 如果路径中已经包含查询参数（即包含 '?'），直接返回处理后的路径
	if (path.includes('?')) {
		return normalizedPath
	}

	// 若没有传入查询参数，直接返回处理后的路径
	if (!query) {
		return normalizedPath
	}

	// 构建查询字符串，过滤掉值为 undefined 或 null 的参数，并对键值进行编码
	const queryStr = Object.keys(query)
		// 过滤掉值为 undefined 或 null 的参数
		.filter(key => query[key] !== undefined && query[key] !== null)
		// 对每个键值对进行编码，格式为 "key=value"
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
		// 将所有键值对用 '&' 连接成字符串
		.join('&')

	// 如果查询字符串不为空，将其追加到路径后面，否则直接返回路径
	return queryStr ? `${normalizedPath}?${queryStr}` : normalizedPath
}
