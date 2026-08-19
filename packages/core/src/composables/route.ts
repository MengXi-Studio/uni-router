import { ref, type Ref } from 'vue'
import type { Router, RouteLocation } from '@/types'
import { useRouter } from './router'

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
export function getReactiveRoute(router: Router): Ref<RouteLocation> {
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
