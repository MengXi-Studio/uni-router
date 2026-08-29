/**
 * 获取页面栈顶部的 uni-page 元素
 *
 * uni-app H5 将每个页面渲染为 `<uni-page>`，栈顶元素即为当前页面。
 */
export function getTopPageElement(): HTMLElement | null {
	if (typeof document === 'undefined') return null
	const pages = document.querySelectorAll('uni-page')
	if (!pages.length) return null
	return pages[pages.length - 1] as HTMLElement
}
