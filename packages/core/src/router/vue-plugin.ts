import type { App } from 'vue'
import type { NavigationId, ParamObject, RouteLocation, Router } from '@/types'
import { NAV_ID_KEY } from '@/params'
import { removeInterceptors } from '@/interceptor'
import { ROUTER_SYMBOL } from './symbol'

/**
 * Vue 插件安装选项
 */
export interface VuePluginInstallOptions {
	/** 是否启用了 uni API 拦截器（决定是否注册清理回调） */
	interceptUniApi: boolean
	/** 是否启用了内置通信管理器（决定是否注入 onUnload mixin） */
	useUniEventChannel: boolean
	/** 标记路由器就绪的回调 */
	markReady: () => void
}

/**
 * 安装 Vue 插件
 *
 * 将路由器实例集成到 Vue 应用中：
 * - provide/inject 机制（使 useRouter()/useRoute() 可用）
 * - $router / $route 全局属性（避免与 uni-app H5 内置 vue-router 冲突）
 * - uni API 拦截器清理回调注册
 * - 内置通信管理器的 onUnload 自动清理 mixin
 * - 标记路由器就绪
 *
 * @param app - Vue 应用实例
 * @param router - 路由器实例（需提供 currentRoute 和 destroyChannel）
 * @param options - 插件安装选项
 */
export function installRouterPlugin(
	app: App,
	router: Router & {
		readonly currentRoute: RouteLocation
		destroyChannel(navigationId: NavigationId): void
	},
	options: VuePluginInstallOptions
): void {
	// 通过 provide/inject 机制提供路由器，使 useRouter()/useRoute() 可用
	app.provide(ROUTER_SYMBOL, router)

	// 仅在 $router 和 $route 未被定义时设置全局属性
	// 避免与 uni-app H5 内置的 vue-router 冲突
	if (!('$router' in app.config.globalProperties)) {
		app.config.globalProperties.$router = router
	}
	if (!('$route' in app.config.globalProperties)) {
		Object.defineProperty(app.config.globalProperties, '$route', {
			enumerable: true,
			configurable: true,
			get: () => router.currentRoute
		})
	}

	if (options.interceptUniApi) {
		// app.onUnmount 是 Vue 3.5+ API，uni-app 可能不支持
		// 在 uni-app 中应用不会真正卸载，拦截器无需清理
		if (typeof app.onUnmount === 'function') {
			app.onUnmount(() => removeInterceptors())
		}
	}

	// 启用内置通信管理器时，注入页面 onUnload mixin 自动清理通道监听器
	// 避免页面销毁后 uni.$on 注册的监听器残留导致内存泄漏
	if (options.useUniEventChannel) {
		app.mixin({
			onUnload(this: { $route?: { params?: ParamObject }; $router?: Router }) {
				const navId = this.$route?.params?.[NAV_ID_KEY] as NavigationId | undefined
				if (navId && this.$router) {
					this.$router.destroyChannel(navId)
				}
			}
		})
	}

	// 在 install 时标记路由器就绪，确保 isReady() 回调在所有插件安装完成后执行
	options.markReady()
}
