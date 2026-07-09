import { inject, ref, onUnmounted, type Ref } from 'vue'
import type { Router, RouteLocation, EventChannel } from '@/types'
import { RouterErrorCode } from '@/types/error'
import { RouterError } from '@/errors'
import { ROUTER_SYMBOL } from '@/router'
import { noopChannel, getOrCreateChannel, destroyChannel } from '@/channel'

/**
 * 获取当前路由器实例
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 * 内部通过 Vue 的 inject 机制获取路由器实例。
 *
 * @returns 路由器实例
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { useRouter } from '@meng-xi/uni-router'
 *
 * const router = useRouter()
 * await router.push({ name: 'home' })
 * ```
 */
export function useRouter(): Router {
	let router: Router | undefined
	try {
		router = inject<Router>(ROUTER_SYMBOL)
	} catch {
		throw new RouterError(RouterErrorCode.SETUP_ERROR, 'useRouter() must be called inside setup() of a Vue component')
	}
	if (!router) {
		throw new RouterError(RouterErrorCode.SETUP_ERROR, 'useRouter() requires router.install(app) to be called first')
	}
	return router
}

/**
 * 模块级缓存，确保同一 router 实例共享同一个响应式 ref
 */
const reactiveRouteMap = new WeakMap<Router, Ref<RouteLocation>>()

/**
 * 获取或创建路由器对应的响应式路由 ref
 *
 * 同一 router 实例只会创建一个 ref，后续调用复用已有的 ref。
 * 通过 router.onRouteChange 监听路由变化，自动更新 ref 的值。
 *
 * @param router - 路由器实例
 * @returns 响应式路由位置 ref
 */
function getReactiveRoute(router: Router): Ref<RouteLocation> {
	let routeRef = reactiveRouteMap.get(router)
	if (routeRef) return routeRef

	routeRef = ref(router.currentRoute) as Ref<RouteLocation>
	reactiveRouteMap.set(router, routeRef)

	router.onRouteChange(to => {
		routeRef!.value = to
	})

	return routeRef
}

/**
 * 获取当前路由位置的响应式引用
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 * 返回的是响应式的路由位置 ref，当路由变化时组件会自动重新渲染。
 *
 * @returns 响应式路由位置 ref
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { useRoute } from '@meng-xi/uni-router'
 *
 * const route = useRoute()
 * // 在模板中直接使用 route.path、route.query 等
 * // 路由变化时组件会自动更新
 * ```
 */
export function useRoute(): Ref<RouteLocation> {
	const router = useRouter()
	return getReactiveRoute(router)
}

/**
 * 获取当前页面的通信通道
 *
 * 必须在 Vue 组件的 setup() 函数中调用。
 * 内部自动读取 `route.params.__navId`：
 * - 有 navId 时返回与导航方共享的 EventChannel 实例（基于 uni.$emit/$on）
 * - 无 navId 时返回 no-op channel，避免调用方需判空
 *
 * 页面卸载时自动销毁通道，清理所有事件监听器，防止内存泄漏。
 *
 * 仅在 `createRouter({ useUniEventChannel: true })` 时有效。
 * 默认模式下（useUniEventChannel: false）始终返回 no-op channel。
 *
 * @returns 事件通道实例
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { usePageChannel } from '@meng-xi/uni-router'
 *
 * const channel = usePageChannel()
 *
 * // 监听导航方发送的事件
 * channel.on('data', (payload) => {
 *   console.log('received:', payload)
 * })
 *
 * // 向导航方发送事件
 * channel.emit('ready', { status: 'ok' })
 * ```
 */
export function usePageChannel(): EventChannel {
	const router = useRouter()
	const route = getReactiveRoute(router)
	const navId = route.value.params?.__navId as string | undefined

	// 无 navId 时返回 no-op channel，避免调用方需判空
	if (!navId) return noopChannel

	// 获取或创建通道（同一 navId 复用已注册通道）
	const channel = getOrCreateChannel(navId)

	// 页面卸载时销毁通道，清理所有监听器
	// 注意：仅销毁当前页面持有的通道，不影响其他页面的通道
	onUnmounted(() => {
		destroyChannel(navId)
	})

	return channel
}
