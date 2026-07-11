import type { RouteLocation, RouteLocationRaw, RouterOptions } from '@/types'
import type { EventChannel } from '@/types'
import type { UniNavigationOptions } from '@/navigation'
import type { ParamsManager } from '@/plugins/params/params-manager'
import type { App } from 'vue'

/**
 * 导航准备上下文
 *
 * 在 uni API 调用前，插件通过此上下文修改导航 URL query 和选项。
 */
export interface NavigationPrepareContext {
	/** 目标路由 */
	to: RouteLocation
	/** 来源路由 */
	from: RouteLocation
	/** 导航模式 */
	mode: 'push' | 'replace' | 'relaunch' | 'back'
	/** 插件间共享数据，由 onAfterResolve 阶段填充 */
	pluginData: Record<string, any>
	/** 实际导航 URL 的 query（可变：插件添加内部 key） */
	query: Record<string, string>
	/** uni 导航选项（可变：插件修改） */
	options: UniNavigationOptions
}

/**
 * 导航完成上下文
 *
 * 在 uni API 调用成功后，插件通过此上下文扩展 NavigationResult。
 */
export interface NavigationCompleteContext {
	/** 目标路由 */
	to: RouteLocation
	/** 导航模式 */
	mode: 'push' | 'replace' | 'relaunch' | 'back'
	/** 插件间共享数据 */
	pluginData: Record<string, any>
	/** 原生 eventChannel（仅 push 模式可用） */
	nativeEventChannel?: EventChannel
	/** 导航结果（可变：插件扩展） */
	result: Record<string, any>
}

/**
 * 插件上下文
 *
 * 路由器暴露给插件的 hook 注册接口，插件通过此接口注册各种钩子。
 */
export interface PluginContext {
	/**
	 * 在 matcher.resolve() 前增强原始路由位置
	 *
	 * 例如：注入 __params_key、__nav_id 到 query 中
	 */
	onEnrichLocation(hook: (location: RouteLocationRaw) => RouteLocationRaw): void

	/**
	 * resolve 之后、守卫之前，从增强后的路由位置中提取插件数据
	 *
	 * 因为 matcher.resolve 会丢弃内部 key，插件需在此阶段提取数据存入 pluginData
	 */
	onAfterResolve(hook: (enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>) => void): void

	/**
	 * uni API 调用前，修改导航 URL query 和选项
	 *
	 * 插件可将内部 key 拼回 query，或修改 navOptions
	 */
	onPrepareNavigation(hook: (ctx: NavigationPrepareContext) => void): void

	/**
	 * uni API 调用成功后，扩展 NavigationResult
	 *
	 * 例如：ChannelPlugin 用内部通道替代原生 eventChannel
	 */
	onCompleteNavigation(hook: (ctx: NavigationCompleteContext) => void): void

	/**
	 * 导航中止或失败时，执行清理操作
	 *
	 * 例如：destroyChannel
	 */
	onNavigationAbort(hook: (pluginData: Record<string, any>) => void): void

	/**
	 * syncCurrentRoute 期间，从 URL query 中提取插件数据
	 *
	 * 例如：从 query 中提取 __params_key 重建 params
	 */
	onRouteSync(hook: (query: Record<string, string>, params: Record<string, any>) => void): void

	/**
	 * router.install() 被调用时触发
	 *
	 * 插件可在此注册 app 级别的清理逻辑
	 */
	onAppInstall(hook: (app: App) => void): void

	/** 当前路由位置（只读） */
	readonly currentRoute: RouteLocation

	/** 解析路由位置为完整的 RouteLocation 对象 */
	resolve(location: RouteLocationRaw): RouteLocation

	/** 路由器实例引用（仅特定插件需要，如 InterceptorPlugin） */
	readonly router: import('@/types').Router

	/** 核心 ParamsManager 实例（供 ParamsPlugin 共享使用） */
	readonly paramsManager: ParamsManager
}

/**
 * 路由器插件接口（Swiper.js 风格）
 *
 * 每个插件通过 install 方法注册 hook 到 PluginContext，
 * 路由器在导航流程的各个阶段依次调用已注册的 hook。
 */
export interface RouterPlugin {
	/** 插件名称 */
	name: string
	/**
	 * 安装插件
	 *
	 * @param context - 插件上下文，用于注册 hook
	 * @param options - 路由器初始化选项（插件可读取自己的选项）
	 */
	install(context: PluginContext, options: RouterOptions): void
}
