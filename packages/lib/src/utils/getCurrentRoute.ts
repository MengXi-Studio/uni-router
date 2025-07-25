import { CurrentPage, Route } from '@/type'
import { buildUrl } from './buildUrl'

/**
 * 获取当前路由信息，根据传入的当前页面实例提取路由相关信息
 * @param currentPage 当前页面实例，可能为 null
 * @returns 当前路由对象，包含路径、完整路径和查询参数，若页面实例为 null 则返回 null
 */
export function getCurrentRoute(currentPage: CurrentPage | null): Route | null {
	// 若当前页面实例为 null，说明没有有效的页面信息，直接返回 null
	if (!currentPage) {
		return null
	}

	// 使用条件编译处理多平台差异，初始化查询参数对象，默认为空对象
	let options: Record<string, string> = {}
	// 获取当前的平台标识
	const key = String(process.env.UNI_PLATFORM).toString().toLowerCase()

	// 在微信小程序、支付宝小程序、百度小程序、头条小程序、QQ 小程序平台下，获取页面参数
	// 这里表示在指定的小程序平台下，从当前页面实例的 options 属性获取查询参数
	// 若 options 不存在，则使用空对象
	if (['mp-weixin', 'mp-alipay', 'mp-baidu', 'mp-toutiao', 'mp-qq'].includes(key)) {
		options = currentPage.options || {}
	}

	// 在 H5 平台下，从 Vue 实例的路由信息中获取查询参数
	// 通过 $vm 访问 Vue 实例，再从 $route 属性中获取查询参数
	// 若相关属性不存在，则使用空对象
	if (['h5'].includes(key)) {
		options = currentPage.$vm?.$route?.query || {}
	}

	// 在 App 平台下，从 Vue 实例的小程序相关信息中获取查询参数
	// 通过 $vm 访问 Vue 实例，再从 $mp.query 属性中获取查询参数
	// 若相关属性不存在，则使用空对象
	if (['app-plus'].includes(key)) {
		options = currentPage.$vm?.$mp?.query || {}
	}

	// 返回当前路由对象
	return {
		// 路由路径，若 currentPage.route 不存在则使用空字符串
		path: currentPage.route || '',
		// 完整路由路径，调用 buildUrl 函数构建，若 currentPage.route 不存在则使用空字符串
		fullPath: buildUrl(currentPage.route || ''),
		// 查询参数对象
		query: options
	}
}
