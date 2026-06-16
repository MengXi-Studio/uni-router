import type { RouteLocation, RouteMeta } from '@/types/route'
import { buildFullPath } from '@/utils/path'

/**
 * 路由变化监听器函数类型
 * @param to - 新的路由位置
 * @param from - 之前的路由位置
 */
type RouteChangeListener = (to: RouteLocation, from: RouteLocation) => void

/**
 * 路由初始位置，表示路由器尚未初始化时的默认状态
 */
const START_LOCATION: RouteLocation = Object.freeze({
	path: '/',
	meta: Object.freeze({}),
	query: Object.freeze({}),
	fullPath: '/'
})

/** `onReady` 默认超时时间（毫秒），设为 0 表示永不超时 */
const DEFAULT_READY_TIMEOUT = 0

/**
 * 创建路由状态管理器
 *
 * 管理当前路由位置、就绪状态和路由变化监听。
 * 所有路由状态变更均通过此模块进行，确保状态一致性。
 *
 * @param readyTimeout - 就绪超时时间（毫秒），0 表示永不超时
 * @returns 路由状态管理器方法集合
 */
export function createRouteState(readyTimeout: number = DEFAULT_READY_TIMEOUT) {
	let currentRoute: RouteLocation = START_LOCATION
	let ready = false
	const readyResolvers: Array<() => void> = []
	const readyRejecters: Array<(reason: Error) => void> = []
	const listeners: RouteChangeListener[] = []
	let readyTimer: ReturnType<typeof setTimeout> | null = null

	/**
	 * 获取当前路由位置
	 * @returns 当前路由位置的只读引用
	 */
	function getCurrentRoute(): RouteLocation {
		return currentRoute
	}

	/**
	 * 设置当前路由位置，并通知所有监听器
	 *
	 * 路由对象及其嵌套的 meta、query 属性会被深度冻结以确保不可变性。
	 * 首次调用时将路由器标记为就绪状态，并 resolve 所有等待中的 onReady Promise。
	 *
	 * @param route - 新的路由位置
	 */
	function setCurrentRoute(route: RouteLocation): void {
		const from = currentRoute
		currentRoute = Object.freeze({
			...route,
			meta: Object.freeze({ ...route.meta }),
			query: Object.freeze({ ...route.query })
		})

		if (!ready) {
			ready = true
			if (readyTimer) {
				clearTimeout(readyTimer)
				readyTimer = null
			}
			for (const resolve of readyResolvers) {
				resolve()
			}
			readyResolvers.length = 0
			readyRejecters.length = 0
		}

		for (const listener of listeners) {
			listener(currentRoute, from)
		}
	}

	/**
	 * 根据路径、元信息和查询参数初始化当前路由
	 * @param path - 页面路径
	 * @param meta - 路由元信息
	 * @param query - 查询参数
	 */
	function initCurrentRoute(path: string, meta: RouteMeta, query: Record<string, string>): void {
		const fullPath = buildFullPath(path, query)
		setCurrentRoute({ path, meta, query, fullPath })
	}

	/**
	 * 检查路由器是否已就绪
	 * @returns 就绪时返回 true
	 */
	function isReady(): boolean {
		return ready
	}

	/**
	 * 等待路由器初始化完成
	 *
	 * 若路由器已就绪则立即 resolve，否则返回一个在路由器就绪后 resolve 的 Promise。
	 * 支持多次并发调用，每个调用都会在路由器就绪时被 resolve。
	 *
	 * 若配置了 `readyTimeout`（大于 0），超时后 Promise 将被 reject，
	 * 防止路由器初始化异常时 `await router.isReady()` 永久挂起。
	 *
	 * @returns 路由器就绪后 resolve 的 Promise
	 * @throws {Error} 超时后 reject，错误信息包含超时时间
	 */
	function onReady(): Promise<void> {
		if (ready) return Promise.resolve()
		return new Promise<void>((resolve, reject) => {
			readyResolvers.push(resolve)
			readyRejecters.push(reject)

			if (readyTimeout > 0 && !readyTimer) {
				readyTimer = setTimeout(() => {
					if (ready) return
					const error = new Error(`[uni-router] Router isReady() timed out after ${readyTimeout}ms. The router was not initialized properly.`)
					for (const rejecter of readyRejecters) {
						rejecter(error)
					}
					readyResolvers.length = 0
					readyRejecters.length = 0
					readyTimer = null
				}, readyTimeout)
			}
		})
	}

	/**
	 * 注册路由变化监听器
	 * @param listener - 路由变化回调函数
	 * @returns 用于移除此监听器的函数
	 */
	function onRouteChange(listener: RouteChangeListener): () => void {
		listeners.push(listener)
		return () => {
			const index = listeners.indexOf(listener)
			if (index > -1) listeners.splice(index, 1)
		}
	}

	return {
		getCurrentRoute,
		setCurrentRoute,
		initCurrentRoute,
		isReady,
		onReady,
		onRouteChange
	}
}
