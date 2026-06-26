import { inject, ref, onUnmounted, type Ref } from 'vue'
import type { Router, RouteLocation, PageChannel, ParamObject, NavigationId } from '@/types'
import { RouterErrorCode } from '@/types/error'
import { RouterError } from '@/errors'
import { ROUTER_SYMBOL } from '@/router'
import { NAV_ID_KEY } from '@/params'

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
 * 获取当前页面的通信通道（目标页面侧）
 *
 * 必须在 Vue 组件的 setup() 中调用。读取当前路由的 `params.__navId` 并返回对应的 PageChannel。
 *
 * 行为：
 * - 存在 navId（启用 `useUniEventChannel` 且由路由器导航进入）：返回真实通道，
 *   组件可通过 `on` / `once` 监听调用方事件，通过 `emit` 向调用方发送事件
 * - 不存在 navId（如直接通过 URL 进入、H5 刷新后丢失、`useUniEventChannel: false`）：
 *   返回 no-op 通道，所有方法静默忽略，不报错
 *
 * 自动清理：组件 onUnmounted 时自动调用 `destroyChannel`，移除该通道的所有监听器，
 * 避免内存泄漏。与 install 时注入的 onUnload mixin 互为补充（均幂等）。
 *
 * @returns PageChannel 实例（可能为 no-op）
 *
 * @example
 * ```ts
 * import { usePageChannel } from '@meng-xi/uni-router'
 *
 * const channel = usePageChannel()
 *
 * // 监听调用方事件
 * channel.on('init', (data: { from: string }) => {
 *   console.log('收到调用方初始化：', data)
 * })
 *
 * // 向调用方发送事件
 * function onConfirm() {
 *   channel.emit('confirm', { ok: true })
 * }
 * ```
 */
export function usePageChannel(): PageChannel {
	const router = useRouter()
	const route = useRoute()
	const navId = (route.value.params as ParamObject | undefined)?.[NAV_ID_KEY] as NavigationId | undefined

	const channel = navId
		? router.getChannelReceiver(navId)
		: router.createNoOpChannel()

	// 自动清理：组件卸载时移除监听器，避免内存泄漏
	// 与 install 时注入的 onUnload mixin 互为补充（destroyChannel 幂等）
	onUnmounted(() => {
		if (navId) {
			router.destroyChannel(navId)
		}
	})

	return channel
}
