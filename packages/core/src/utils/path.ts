/**
 * 将路径和查询参数组合为完整的路径字符串
 * @param path - 路径部分
 * @param query - 查询参数键值对
 * @returns 包含查询参数的完整路径，无参数时返回原始路径
 */
export function buildFullPath(path: string, query: Record<string, string>): string {
	const keys = Object.keys(query)
	if (keys.length === 0) return path

	const qs = keys.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

	return `${path}?${qs}`
}

/**
 * 解析查询字符串为键值对对象
 * @param queryString - 待解析的查询字符串，可带或不带 `?` 前缀
 * @returns 解析后的查询参数键值对
 */
export function parseQuery(queryString: string): Record<string, string> {
	const query: Record<string, string> = {}
	if (!queryString) return query

	const search = queryString.startsWith('?') ? queryString.slice(1) : queryString
	if (!search) return query

	for (const pair of search.split('&')) {
		const separatorIndex = pair.indexOf('=')
		if (separatorIndex === -1) {
			if (pair) query[decodeURIComponent(pair)] = ''
			continue
		}
		const key = pair.slice(0, separatorIndex)
		const value = pair.slice(separatorIndex + 1)
		if (key) {
			query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''
		}
	}

	return query
}

/**
 * 规范化路径，确保以 `/` 开头
 * @param path - 待规范化的路径
 * @returns 以 `/` 开头的路径
 */
export function normalizePath(path: string): string {
	return path.startsWith('/') ? path : `/${path}`
}
