import type { Router } from '@/types'
import { normalizePath, parseQuery } from '@/utils/path'

/**
 * uni API 拦截器模块
 *
 * 通过 uni.addInterceptor 拦截原生导航 API（navigateTo / redirectTo / switchTab / navigateBack），
 * 将外部直接调用重定向到路由器实例，确保路由守卫始终生效。
 *
 * 拦截器通过内部标记区分「路由器发起的调用」和「外部直接调用」：
 * - 路由器发起：标记放行，不重复执行守卫
 * - 外部直接调用：阻止原始调用，转由 router.push / replace / back 执行完整守卫链
 */

/** 需要拦截的 uni 导航 API 列表 */
const INTERCEPTED_APIS = ['navigateTo', 'redirectTo', 'switchTab', 'navigateBack'] as const

/**
 * 拦截器管理器
 *
 * 封装拦截器的状态（路由器引用、调用计数器），
 * 支持多路由器实例各自持有独立的拦截器状态。
 */
class InterceptorManager {
	/** 路由器内部发起的 uni API 调用计数器，用于区分路由器调用和外部调用 */
	private routerCallCount = 0
	/** 路由器实例引用 */
	private router: Router | null = null

	/**
	 * 标记下一次 uni API 调用由路由器内部发起
	 *
	 * 在调用 uni.navigateTo 等方法前调用，拦截器检测到此标记后放行。
	 * 使用计数器而非布尔值，避免并发导航时标记被错误消费。
	 */
	markRouterCall(): void {
		this.routerCallCount++
	}

	/**
	 * 检查当前调用是否由路由器内部发起，若是则消费计数并放行
	 */
	isRouterCall(): boolean {
		if (this.routerCallCount > 0) {
			this.routerCallCount--
			return true
		}
		return false
	}

	/**
	 * 获取路由器实例
	 */
	getRouter(): Router | null {
		return this.router
	}

	/**
	 * 设置路由器实例
	 */
	setRouter(router: Router | null): void {
		this.router = router
	}

	/**
	 * 重置所有状态
	 */
	reset(): void {
		this.router = null
		this.routerCallCount = 0
	}
}

/** 当前活跃的拦截器管理器实例 */
let activeManager: InterceptorManager | null = null

/**
 * 标记下一次 uni API 调用由路由器内部发起
 *
 * 在调用 uni.navigateTo 等方法前调用，拦截器检测到此标记后放行。
 * 使用计数器而非布尔值，避免并发导航时标记被错误消费。
 */
export function markRouterCall(): void {
	activeManager?.markRouterCall()
}

/**
 * 解析 uni API 的 URL 为路径和查询参数
 *
 * @param url - uni API 传入的 URL，如 "/pages/about/about?id=1"
 * @returns 路径和查询参数
 */
function parseUniUrl(url: string): { path: string; query: Record<string, string> } {
	if (!url) return { path: '', query: {} }

	const queryIndex = url.indexOf('?')
	const rawPath = queryIndex === -1 ? url : url.slice(0, queryIndex)
	const queryString = queryIndex === -1 ? '' : url.slice(queryIndex + 1)

	const path = normalizePath(rawPath)
	const query = queryString ? parseQuery(queryString) : {}

	return { path, query }
}

/**
 * 处理被拦截的外部导航调用
 *
 * 阻止原始 uni API 调用，转由路由器执行完整的守卫链和导航流程。
 *
 * @param api - uni API 名称
 * @param args - uni API 调用参数
 * @returns 始终返回 false 以阻止原始 API 调用
 */
function handleInterceptedNavigation(api: string, args: Record<string, any>): false {
	const router = activeManager?.getRouter()
	if (!router) return false

	switch (api) {
		case 'navigateTo': {
			const { path, query } = parseUniUrl(args.url || '')
			if (path) {
				const hasQuery = query && Object.keys(query).length > 0
				router.push(hasQuery ? { path, query } : path)
			}
			break
		}
		case 'redirectTo': {
			const { path, query } = parseUniUrl(args.url || '')
			if (path) {
				const hasQuery = query && Object.keys(query).length > 0
				router.replace(hasQuery ? { path, query } : path)
			}
			break
		}
		case 'switchTab': {
			const { path } = parseUniUrl(args.url || '')
			if (path) {
				router.push(path)
			}
			break
		}
		case 'navigateBack': {
			router.back(args.delta || 1)
			break
		}
	}

	return false
}

/**
 * 安装 uni API 拦截器
 *
 * 拦截 navigateTo、redirectTo、switchTab、navigateBack 四个导航 API，
 * 将外部直接调用重定向到路由器实例，确保路由守卫始终生效。
 *
 * @param router - 路由器实例
 */
export function installInterceptors(router: Router): void {
	if (typeof uni.addInterceptor !== 'function') {
		console.warn('[uni-router] uni.addInterceptor is not available, interceptUniApi option will be ignored')
		return
	}

	// 如果已有活跃管理器，先清理并警告
	if (activeManager) {
		console.warn('[uni-router] Another router instance has already installed interceptors. Replacing with the new instance. Only one router instance with interceptUniApi is supported.')
		removeInterceptors()
	}

	activeManager = new InterceptorManager()
	activeManager.setRouter(router)

	for (const api of INTERCEPTED_APIS) {
		uni.addInterceptor(api, {
			invoke(args: Record<string, any>) {
				if (activeManager?.isRouterCall()) {
					return args
				}
				// 双重保险：修改 URL 防止低版本基础库忽略返回值
				// 部分低版本小程序基础库可能忽略 invoke 返回的 false 而继续执行原始 API
				if ('url' in args) args.url = ''
				return handleInterceptedNavigation(api, args)
			}
		})
	}
}

/**
 * 移除 uni API 拦截器
 *
 * 清除所有已注册的导航拦截器并释放路由器引用。
 */
export function removeInterceptors(): void {
	if (typeof uni.removeInterceptor === 'function') {
		for (const api of INTERCEPTED_APIS) {
			uni.removeInterceptor(api)
		}
	}
	if (activeManager) {
		activeManager.reset()
		activeManager = null
	}
}
