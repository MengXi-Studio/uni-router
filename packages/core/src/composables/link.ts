import { computed, type ComputedRef } from 'vue'
import { useRouter } from './router'
import { useRoute } from './route'
import type { RouteLocationRaw, RouteLocation, NavigationResult } from '@/types'

/**
 * useLink 的选项，与 RouterLink 组件的 props 对应
 *
 * 支持传入普通对象或 ref 包裹的值。
 */
export interface UseLinkOptions {
	/** 目标路由位置，支持路径字符串、路径对象或命名路由对象 */
	to: RouteLocationRaw
	/** 是否使用 replace 模式导航 */
	replace?: boolean
	/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
	relaunch?: boolean
}

/**
 * useLink 的返回值
 */
export interface UseLinkReturn {
	/** 解析后的路由对象 */
	route: ComputedRef<RouteLocation>
	/** 目标路径字符串（fullPath，包含 query 参数） */
	href: ComputedRef<string>
	/** 当前路由是否匹配此链接（比较 path，忽略 query 和 hash） */
	isActive: ComputedRef<boolean>
	/** 当前路由是否完全匹配此链接（比较 fullPath，包含 query） */
	isExactActive: ComputedRef<boolean>
	/** 执行导航到目标页面 */
	navigate: () => Promise<NavigationResult>
}

/**
 * 暴露 RouterLink 内部行为为组合式 API
 *
 * 用于构建自定义导航组件，与 Vue Router 4.x 的 `useLink` 行为一致。
 * 返回响应式的路由信息、匹配状态和导航方法，方便在自定义组件中复用 RouterLink 的逻辑。
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 *
 * @param options - 选项对象，包含目标路由位置和导航模式
 * @returns 包含路由信息、匹配状态和导航方法的对象
 *
 * @example
 * ```ts
 * import { useLink } from '@meng-xi/uni-router'
 *
 * const { href, isActive, isExactActive, navigate } = useLink({
 *   to: { name: 'pagesDetailDetail', query: { id: '1' } }
 * })
 *
 * // 响应式绑定
 * const classes = computed(() => ({
 *   'nav-link': true,
 *   'nav-link-active': isActive.value
 * }))
 * ```
 *
 * @example
 * ```ts
 * // 在自定义组件中使用
 * const props = defineProps<{
 *   to: RouteLocationRaw
 *   replace?: boolean
 * }>()
 *
 * const { href, isActive, navigate } = useLink(props)
 * ```
 */
export function useLink(options: UseLinkOptions): UseLinkReturn {
	const router = useRouter()
	const currentRoute = useRoute()

	const route = computed(() => router.resolve(options.to))
	const href = computed(() => route.value.fullPath)
	const isActive = computed(() => currentRoute.value.path === route.value.path)
	const isExactActive = computed(() => currentRoute.value.fullPath === route.value.fullPath)

	async function navigate(): Promise<NavigationResult> {
		if (options.relaunch) {
			return router.relaunch(options.to)
		} else if (options.replace) {
			return router.replace(options.to)
		}
		return router.push(options.to)
	}

	return { route, href, isActive, isExactActive, navigate }
}
