/**
 * 输出警告信息到控制台
 * @param message - 警告信息内容
 */
export function warn(message: string): void {
	if (typeof console !== 'undefined') {
		console.warn(`[uni-router] ${message}`)
	}
}

/**
 * 检查给定值是否为非 null 的对象类型
 * @param value - 待检查的值
 * @returns 当值为非 null 对象时返回 true
 */
export function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object'
}
