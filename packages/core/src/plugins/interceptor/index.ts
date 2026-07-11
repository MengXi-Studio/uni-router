import type { RouterPlugin, PluginContext } from '@/plugin'
import type { RouterOptions } from '@/types'
import { installInterceptors, removeInterceptors } from './install'
import type { App } from 'vue'

// Re-export implementation code for external use
export { markRouterCall, installInterceptors, removeInterceptors } from './install'

/**
 * InterceptorPlugin - uni API 拦截器插件
 *
 * 提供拦截 uni 原生导航 API 的能力：
 * - 拦截 navigateTo、redirectTo、switchTab、navigateBack
 * - 将外部直接调用重定向到路由器实例，确保路由守卫始终生效
 * - 通过模块增强为 RouterOptions 添加 interceptUniApi 选项
 */
export const InterceptorPlugin: RouterPlugin = {
	name: 'interceptor',

	install(context: PluginContext, options: RouterOptions) {
		const interceptUniApi = options.interceptUniApi ?? false
		if (!interceptUniApi) return

		// install 时安装拦截器，传入路由器实例
		installInterceptors(context.router)

		// onAppInstall: 注册清理逻辑
		context.onAppInstall((app: App) => {
			if (typeof app.onUnmount === 'function') {
				app.onUnmount(() => removeInterceptors())
			}
		})
	}
}
