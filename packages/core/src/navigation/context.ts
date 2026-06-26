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

/**
 * 获取当前页面栈的长度
 * @returns 页面栈中的页面数量
 */
export function getPageStackLength(): number {
	return safeGetCurrentPages().length
}

/**
 * 获取当前页面路径
 * @returns 当前页面的路径（以 `/` 开头），页面栈为空时返回 `/`
 */
export function getCurrentPagePath(): string {
	const pages = safeGetCurrentPages()
	if (pages.length === 0) return '/'
	const currentPage = pages[pages.length - 1]
	return `/${currentPage.route}`
}

/**
 * 获取当前页面的查询参数
 * @returns 查询参数键值对，页面栈为空或无参数时返回空对象
 */
export function getCurrentPageQuery(): Record<string, string> {
	const pages = safeGetCurrentPages()
	if (pages.length === 0) return {}
	const currentPage = pages[pages.length - 1]
	if (!currentPage?.options) return {}
	const query: Record<string, string> = {}
	for (const [key, value] of Object.entries(currentPage.options)) {
		if (value !== undefined) {
			query[key] = String(value)
		}
	}
	return query
}
