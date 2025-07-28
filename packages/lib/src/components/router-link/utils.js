/**
 * 解析路由位置信息
 * 如果传入的 location 是字符串类型，直接将其作为路径返回，查询参数默认为 undefined
 * 若 location 是对象且包含 query 属性，将 query 转换为键值对均为字符串的对象
 * @param {string | object} location - 路由位置信息，可以是字符串或对象
 * @returns {object} - 包含解析后的路径和查询参数的对象，格式为 { path, query }
 */
export function parseLocation(location) {
	if (typeof location === 'string') {
		return { path: location }
	}

	const query =
		typeof location.query === 'object' && location.query !== null ? Object.fromEntries(Object.entries(location.query).map(([key, value]) => [key, String(value)])) : undefined

	return {
		path: location.path,
		query
	}
}

/**
 * 构建完整的 URL 字符串，根据传入的路径和查询参数生成最终的 URL
 * @param {string} path - 路径字符串
 * @param {Object.<string, string|number|boolean>} [query] - 可选的查询参数对象，包含键值对，值的类型可以是字符串、数字或布尔值
 * @returns {string} - 构建好的完整 URL 字符串
 */
export function buildUrl(path, query) {
	if (path.startsWith('tabBar/')) {
		return path.startsWith('/') ? path : `/${path}`
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`

	if (path.includes('?')) {
		return normalizedPath
	}

	if (!query) {
		return normalizedPath
	}

	const queryStr = Object.keys(query)
		.filter(key => query[key] !== undefined && query[key] !== null)
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
		.join('&')

	return queryStr ? `${normalizedPath}?${queryStr}` : normalizedPath
}

const toString = Object.prototype.toString

/**
 * 检查一个值是否为指定的类型
 * @param {*} val - 要检查类型的值
 * @param {string} type - 期望的类型名称，例如 'Object'、'Array'、'String' 等
 * @returns {boolean} - 如果值的类型与期望类型匹配则返回 true，否则返回 false
 */
export function is(val, type) {
	return toString.call(val) === `[object ${type}]`
}

/**
 * 检查一个值是否为普通对象
 * @param {*} val - 要检查的值
 * @returns {boolean} - 如果值是普通对象则返回 true，否则返回 false
 */
export function isObject(val) {
	return val !== null && is(val, 'Object')
}

/**
 * 深度合并两个对象
 * 该函数会递归地将目标对象的属性合并到源对象中
 * 如果源对象和目标对象的对应属性都是对象，则会递归调用该函数进行深度合并；
 * 否则，直接用目标对象的属性值覆盖源对象的属性值
 * @param {Object} [src={}] - 源对象，合并操作的基础对象，默认为空对象
 * @param {Object} [target={}] - 目标对象，其属性将被合并到源对象中，默认为空对象
 * @returns {Object} - 合并后的对象
 */
export function deepMerge(src = {}, target = {}) {
	let key
	for (key in target) {
		src[key] = isObject(src[key]) ? deepMerge(src[key], target[key]) : target[key]
	}
	return src
}
