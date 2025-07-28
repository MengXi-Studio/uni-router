import { nextTick, onUnmounted, ref, unref, watch } from 'vue'
import type { MxRouterActionType, MxRouterProps } from '@/common'
import type { Nullable } from '@/types'
import { error, getDynamicProps, isProdMode } from '@/utils'

/**
 * 使用 Router 组件的组合式函数，用于管理 Router 实例并提供操作方法
 *
 * @param routerProps - Router 组件的属性，用于配置路由跳转相关信息
 *
 * @returns 包含注册函数和操作方法的数组，第一个元素为注册函数，第二个元素为操作方法对象
 */
export function useMxRouter(routerProps: MxRouterProps) {
	/** 存储 Router 实例的引用，可能为 null */
	const routerRef = ref<Nullable<MxRouterActionType>>(null)
	/** 标记 Router 实例是否已加载，可能为 null */
	const loadedRef = ref<Nullable<boolean>>(false)

	/**
	 * 获取 MxRouter 实例若实例未获取到，会输出错误信息
	 *
	 * @returns 异步返回 Router 实例
	 */
	async function getRouter() {
		const router = unref(routerRef)
		if (!router) {
			error('The router instance has not been obtained, please make sure that the router has been rendered when performing the router operation!')
		}

		await nextTick()
		return router as MxRouterActionType
	}

	/**
	 * 注册 RouterLink 实例，并监听 `routerLinkProps` 的变化
	 * 在生产环境下，组件卸载时会清理实例引用和加载状态
	 *
	 * @param instance - RouterLink 实例，包含操作方法
	 */
	function register(instance: MxRouterActionType) {
		isProdMode() &&
			onUnmounted(() => {
				routerRef.value = null
				loadedRef.value = null
			})

		if (unref(loadedRef) && isProdMode() && instance === unref(routerRef)) return

		routerRef.value = instance
		loadedRef.value = true

		watch(
			() => routerProps,
			() => {
				routerProps && instance.setProps(getDynamicProps(routerProps))
			},
			{
				immediate: true,
				deep: true
			}
		)
	}

	const methods = {
		/**
		 * 异步设置 Router 组件的属性
		 *
		 * @param routerProps - 要设置的 Router 组件属性
		 */
		setProps: async (routerProps: MxRouterProps) => {
			const router = await getRouter()
			router.setProps(routerProps)
		}
	}

	// 返回注册函数和操作方法
	return [register, methods]
}
