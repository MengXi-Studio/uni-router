import { safeGetCurrentPages } from '@/utils/general'
import { PARAMS_KEY } from '@/constants'

/**
 * 检查指定 params key 对应的页面是否仍在页面栈中
 *
 * 通过遍历页面栈，检查每个页面的 URL 中是否包含 __params_key=<key>
 */
export function isPageInStack(key: string): boolean {
	const pages = safeGetCurrentPages()
	const encodedKey = encodeURIComponent(key)
	return pages.some(page => {
		const fullPath: string = page.$page?.fullPath ?? ''
		return fullPath.includes(`${PARAMS_KEY}=${encodedKey}`)
	})
}
