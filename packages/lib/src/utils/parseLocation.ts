import { RouteLocationRaw } from '@/type'

/**
 * 解析路由位置，将传入的路由位置信息转换为统一的路径和查询参数格式
 * @param location 路由位置信息，可以是字符串类型的路径，也可以是包含路径和查询参数的对象
 * @returns 解析后的路径和可选的查询参数对象，查询参数对象的键值对均为字符串类型
 */
export function parseLocation(location: RouteLocationRaw): { path: string; query?: Record<string, string> } {
	// 如果传入的 location 是字符串类型，直接将其作为路径返回，查询参数默认为 undefined
	if (typeof location === 'string') {
		return { path: location }
	}

	// 若 location 是对象且包含 query 属性，将 query 转换为键值对均为字符串的对象
	// 首先判断 location.query 是否为对象且不为 null
	// 若是，则使用 Object.entries 将其转换为键值对数组，再通过 map 方法将每个值转换为字符串
	// 最后使用 Object.fromEntries 将处理后的键值对数组转换回对象
	// 若不满足条件，则 query 为 undefined
	const query = typeof location.query === 'object' && location.query !== null ? Object.fromEntries(Object.entries(location.query).map(([key, value]) => [key, String(value)])) : undefined

	// 返回解析后的路径和查询参数对象
	return {
		path: location.path,
		query
	}
}
