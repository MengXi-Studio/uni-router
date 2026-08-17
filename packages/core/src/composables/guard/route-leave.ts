import { onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from '@/composables'
import type { RouteLeaveGuard } from '@/types'

/**
 * 组件内离开守卫，在当前组件即将离开时执行
 *
 * 通过返回值控制导航行为，与 Vue Router 4.x 的 onBeforeRouteLeave 一致：
 * - `undefined` / `true` — 放行
 * - `false` — 中止导航
 * - `RouteLocationRaw` — 重定向
 * - `Error` — 取消导航
 * - 抛出异常 — 取消导航
 *
 * 内部通过 router.beforeEach 注册守卫，在组件卸载时自动移除。
 *
 * @param guard - 离开守卫函数，接收目标路由和来源路由，通过返回值控制导航
 *
 * @example
 * ```ts
 * import { onBeforeRouteLeave } from '@meng-xi/uni-router'
 *
 * onBeforeRouteLeave((to, from) => {
 *   if (hasUnsavedChanges) {
 *     return false // 中止导航
 *   }
 * })
 *
 * // 异步离开确认
 * onBeforeRouteLeave((to, from) => {
 *   if (from.meta.dirty) {
 *     return new Promise((resolve) => {
 *       uni.showModal({
 *         title: '提示',
 *         content: '有未保存的修改，确认离开？',
 *         success: (res) => resolve(res.confirm ? true : false)
 *       })
 *     })
 *   }
 * })
 * ```
 */
export function onBeforeRouteLeave(guard: RouteLeaveGuard): void {
	const router = useRouter()
	const route = useRoute()
	const fromPath = route.value.path

	// 注册一个全局前置守卫，仅在 from 匹配当前组件路径时执行用户守卫
	const remove = router.beforeEach((to, from) => {
		if (from.path !== fromPath) return
		return guard(to, from)
	})

	// 组件卸载时自动移除守卫
	onBeforeUnmount(remove)
}
