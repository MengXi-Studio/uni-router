import { nextTick, onUnmounted, ref, unref, watch } from 'vue'
import type { RouterLinkActionType, RouterLinkProps } from './common'
import type { Nullable } from '@/types'
import { error, getDynamicProps, isProdMode } from '@/utils'

/**
 * 使用 RouterLink 组件的组合式函数，用于管理 RouterLink 实例并提供操作方法
 *
 * @param routerLinkProps - RouterLink 组件的属性，用于配置路由跳转相关信息
 *
 * @returns 包含注册函数和操作方法的数组，第一个元素为注册函数，第二个元素为操作方法对象
 */
export function useRouterLink(routerLinkProps: RouterLinkProps) {
	/** 存储 RouterLink 实例的引用，可能为 null */
	const routerLinkRef = ref<Nullable<RouterLinkActionType>>(null)
	/** 标记 RouterLink 实例是否已加载，可能为 null */
	const loadedRef = ref<Nullable<boolean>>(false)

	/**
	 * 获取 RouterLink 实例若实例未获取到，会输出错误信息
	 *
	 * @returns 异步返回 RouterLink 实例
	 */
	async function getRouterLink() {
		const routerLink = unref(routerLinkRef)
		if (!routerLink) {
			error('The routerLink instance has not been obtained, please make sure that the routerLink has been rendered when performing the routerLink operation!')
		}

		await nextTick()
		return routerLink as RouterLinkActionType
	}

	/**
	 * 注册 RouterLink 实例，并监听 `routerLinkProps` 的变化
	 * 在生产环境下，组件卸载时会清理实例引用和加载状态
	 *
	 * @param instance - RouterLink 实例，包含操作方法
	 */
	function register(instance: RouterLinkActionType) {
		isProdMode() &&
			onUnmounted(() => {
				routerLinkRef.value = null
				loadedRef.value = null
			})

		if (unref(loadedRef) && isProdMode() && instance === unref(routerLinkRef)) return

		routerLinkRef.value = instance
		loadedRef.value = true

		watch(
			() => routerLinkProps,
			() => {
				routerLinkProps && instance.setProps(getDynamicProps(routerLinkProps))
			},
			{
				immediate: true,
				deep: true
			}
		)
	}

	const methods = {
		/**
		 * 异步设置 RouterLink 组件的属性
		 *
		 * @param routerLinkProps - 要设置的 RouterLink 组件属性
		 */
		setProps: async (routerLinkProps: RouterLinkProps) => {
			const routerLink = await getRouterLink()
			routerLink.setProps(routerLinkProps)
		}
	}

	// 返回注册函数和操作方法
	return [register, methods]
}
