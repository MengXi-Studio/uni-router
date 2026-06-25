import type { NavigationAnimation, RouteLocationRaw, Router, EventListeners } from '@/types'
import { normalizePath, parseQuery } from '@/utils/path'

/**
 * uni API 拦截器模块
 *
 * 通过 uni.addInterceptor 拦截原生导航 API（navigateTo / redirectTo / switchTab / reLaunch / navigateBack），
 * 将外部直接调用重定向到路由器实例，确保路由守卫始终生效。
 *
 * 拦截器通过内部标记区分「路由器发起的调用」和「外部直接调用」：
 * - 路由器发起：标记放行，不重复执行守卫
 * - 外部直接调用：阻止原始调用，转由 router.push / replace / back 执行完整守卫链
 *
 * **switchTab 特殊处理（H5 平台）**：
 * 仅在 H5 平台下，TabBar 是由运行时管理的组件。若同步阻止（返回 false）uni.switchTab，
 * TabBar 组件的内部「切换中」状态无法被清除，导致后续点击失效。
 * 因此在 H5 平台下对 switchTab 采用「放行原始调用 + success 回调同步状态」的策略，
 * 而非阻止重定向。这意味着 H5 平台下外部 switchTab 调用不经过前置守卫，
 * 权限控制需在页面 onShow 生命周期中处理。
 *
 * 说明：App 平台（含 App-vue 和 App-nvue）的 TabBar 是原生组件，
 * 业务代码运行在 jscore/v8 逻辑层（非 webview），不存在 window/document 对象，
 * 行为与小程序一致，走完整的「阻止 + 转发」流程，守卫正常生效。
 */

/** 需要拦截的 uni 导航 API 列表 */
const INTERCEPTED_APIS = ['navigateTo', 'redirectTo', 'switchTab', 'reLaunch', 'navigateBack'] as const

/**
 * 检测当前是否为 H5 平台
 *
 * 仅 H5 平台的业务代码运行在浏览器环境中，存在 window 和 document 对象；
 * 小程序平台和 App 平台（含 App-vue / App-nvue）的业务代码均运行在 jscore/v8 逻辑层，
 * 不存在 window/document，TabBar 为原生组件，行为与小程序一致。
 *
 * 在 H5 平台下阻止 uni.switchTab 会导致 TabBar 组件状态卡死，需特殊处理。
 *
 * @returns 当前为 H5 平台时返回 true
 */
function isWebPlatform(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined'
}

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
 * 从 uni API 调用参数中提取动画配置
 *
 * uni.navigateTo / uni.navigateBack 支持 animationType 和 animationDuration 参数（仅 App 端），
 * 此函数将其转换为路由器的 NavigationAnimation 格式，以便在拦截器转发时保留动画配置。
 *
 * @param args - uni API 调用参数
 * @returns 动画配置，不存在时返回 undefined
 */
function extractAnimation(args: Record<string, any>): NavigationAnimation | undefined {
	if (!args.animationType) return undefined
	return { type: args.animationType, ...(args.animationDuration != null && { duration: args.animationDuration }) }
}

/**
 * 将路径、查询参数、动画配置和事件监听器合并为 RouteLocationRaw
 *
 * @param path - 页面路径
 * @param query - 查询参数
 * @param animation - 动画配置
 * @param events - 页面间通信事件监听器
 * @returns 路由位置对象
 */
function buildLocation(path: string, query: Record<string, string>, animation?: NavigationAnimation, events?: EventListeners): RouteLocationRaw {
	const hasQuery = query && Object.keys(query).length > 0
	if (!hasQuery && !animation && !events) return path
	return { path, ...(hasQuery && { query }), ...(animation && { animation }), ...(events && { events }) }
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
				const events: EventListeners | undefined = args.events
				router.push(buildLocation(path, query, extractAnimation(args), events))
			}
			break
		}
		case 'redirectTo': {
			const { path, query } = parseUniUrl(args.url || '')
			if (path) {
				router.replace(buildLocation(path, query))
			}
			break
		}
		case 'switchTab': {
			// 仅小程序平台走到此处（Web 平台已在 invoke 中通过 handleWebSwitchTab 放行）
			const { path } = parseUniUrl(args.url || '')
			if (path) {
				router.push(path)
			}
			break
		}
		case 'reLaunch': {
			const { path, query } = parseUniUrl(args.url || '')
			if (path) {
				router.relaunch(buildLocation(path, query))
			}
			break
		}
		case 'navigateBack': {
			router.back(args.delta || 1, extractAnimation(args))
			break
		}
	}

	return false
}

/**
 * 处理 H5 平台下被拦截的 switchTab 调用
 *
 * 在 H5 平台下，阻止 uni.switchTab 会导致 TabBar 组件内部状态卡死，
 * 后续点击失效。因此采用「放行原始调用 + success 回调同步状态」策略：
 * 不阻止原始 switchTab，而是在其 success 回调中调用 router.syncRoute() 同步路由状态。
 *
 * 注意：此策略下外部 switchTab 调用不经过前置守卫（beforeEach），
 * TabBar 页面的权限控制需在页面 onShow 生命周期中处理。
 *
 * @param args - uni API 调用参数
 * @returns 原始 args（放行调用），success 回调已被包装以同步状态
 */
function handleWebSwitchTab(args: Record<string, any>): Record<string, any> {
	const router = activeManager?.getRouter()
	if (!router) return args

	// 包装 success 回调，在 switchTab 完成后同步路由状态
	const originalSuccess = args.success
	args.success = function (res: any) {
		router.syncRoute()
		if (typeof originalSuccess === 'function') {
			originalSuccess(res)
		}
	}

	return args
}

/**
 * 安装 uni API 拦截器
 *
 * 拦截 navigateTo、redirectTo、switchTab、navigateBack 四个导航 API，
 * 将外部直接调用重定向到路由器实例，确保路由守卫始终生效。
 *
 * **switchTab 特殊处理**：在 H5 平台下，switchTab 采用放行 + 同步策略，
 * 避免阻止原始调用导致 TabBar 组件状态卡死。详见 {@link handleWebSwitchTab}。
 * App 平台（App-vue / App-nvue）和小程序平台均走完整的拦截 + 转发流程。
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

				// H5 平台下 switchTab 特殊处理：放行原始调用，在 success 中同步状态
				// 阻止 switchTab 会导致 H5 TabBar 组件状态卡死，后续点击失效
				if (api === 'switchTab' && isWebPlatform()) {
					return handleWebSwitchTab(args)
				}

				// 其他 API：先处理拦截逻辑（在 URL 被清空前解析路径并触发路由器导航）
				const result = handleInterceptedNavigation(api, args)
				// 双重保险：修改 URL 防止低版本基础库忽略返回值
				// 部分低版本小程序基础库可能忽略 invoke 返回的 false 而继续执行原始 API
				if ('url' in args) args.url = ''
				return result
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
