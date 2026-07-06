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

/**
 * 安全获取当前页面栈
 *
 * `getCurrentPages()` 是 uni-app 运行时 API，在 SSR、Node 测试环境、
 * 构建工具静态分析阶段不存在。此函数提供环境保护，避免 `ReferenceError`。
 *
 * @returns 页面栈数组，非 uni-app 环境返回空数组
 */
export function safeGetCurrentPages(): UniPage[] {
	if (typeof getCurrentPages !== 'function') return []
	return getCurrentPages()
}
