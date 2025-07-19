/** 路由位置描述对象 */
export interface RouteLocation {
	/** 目标路径 */
	path: string
	/** 查询参数对象 */
	query?: Record<string, string | number | boolean>
}

/** 路由位置描述，可以是字符串路径或RouteLocation对象 */
export type RouteLocationRaw = string | RouteLocation

/** 当前路由信息 */
export interface Route {
	/** 路由路径 */
	path: string
	/** 完整路径（包含查询参数） */
	fullPath: string
	/** 解析后的查询参数对象 */
	query: Record<string, string>
}
