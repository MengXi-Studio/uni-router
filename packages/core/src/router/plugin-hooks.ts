import type { RouteLocationRaw, RouterOptions, RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext } from '@/types'
import type { App } from 'vue'
import { warn } from '@/utils/general'
import type { PluginHookDeps, EnrichLocationHook, AfterResolveHook, PrepareNavigationHook, CompleteNavigationHook, NavigationAbortHook, RouteSyncHook, AppInstallHook } from './type'

/**
 * 插件 hook 管理器
 *
 * 负责插件安装、PluginContext 构建、hook 注册与各导航阶段的 hook 调度，
 * 以及插件注册状态（installedPlugins）管理。
 */
export class PluginHookManager {
	private enrichLocationHooks: EnrichLocationHook[] = []
	private afterResolveHooks: AfterResolveHook[] = []
	private prepareNavigationHooks: PrepareNavigationHook[] = []
	private completeNavigationHooks: CompleteNavigationHook[] = []
	private navigationAbortHooks: NavigationAbortHook[] = []
	private routeSyncHooks: RouteSyncHook[] = []
	private appInstallHooks: AppInstallHook[] = []
	private installedPlugins: Set<string> = new Set()

	constructor(private deps: PluginHookDeps) {}

	/**
	 * 安装插件并注册 hook
	 */
	install(plugins: RouterPlugin[], options: RouterOptions): void {
		const deps = this.deps
		const context: PluginContext = {
			onEnrichLocation: hook => {
				this.enrichLocationHooks.push(hook)
			},
			onAfterResolve: hook => {
				this.afterResolveHooks.push(hook)
			},
			onPrepareNavigation: hook => {
				this.prepareNavigationHooks.push(hook)
			},
			onCompleteNavigation: hook => {
				this.completeNavigationHooks.push(hook)
			},
			onNavigationAbort: hook => {
				this.navigationAbortHooks.push(hook)
			},
			onRouteSync: hook => {
				this.routeSyncHooks.push(hook)
			},
			onAppInstall: hook => {
				this.appInstallHooks.push(hook)
			},
			get currentRoute() {
				return deps.getCurrentRoute()
			},
			resolve: location => deps.resolve(location),
			get router() {
				return deps.router
			},
			get paramsManager() {
				return deps.paramsManager
			},
			hasPlugin: name => this.installedPlugins.has(name)
		}

		for (const plugin of plugins) {
			this.installedPlugins.add(plugin.name)
			plugin.install(context, options)
		}

		// 检查设置了插件选项但未注册对应插件的情况
		if (options.paramsPersistent && !this.installedPlugins.has('params')) {
			warn('options.paramsPersistent is set but ParamsPlugin is not registered. The option will be ignored.')
		}
		if (options.useUniEventChannel && !this.installedPlugins.has('channel')) {
			warn('options.useUniEventChannel is set but ChannelPlugin is not registered. The option will be ignored.')
		}
		if (options.interceptUniApi && !this.installedPlugins.has('interceptor')) {
			warn('options.interceptUniApi is set but InterceptorPlugin is not registered. The option will be ignored.')
		}
	}

	/**
	 * 检查指定插件是否已注册
	 */
	hasPlugin(name: string): boolean {
		return this.installedPlugins.has(name)
	}

	/**
	 * 执行 enrichLocation hooks，返回增强后的路由位置
	 */
	enrichLocation(location: RouteLocationRaw): RouteLocationRaw {
		let result = location
		for (const hook of this.enrichLocationHooks) result = hook(result)
		return result
	}

	/**
	 * 执行 afterResolve hooks，将插件数据提取到 pluginData
	 */
	afterResolve(enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>): void {
		for (const hook of this.afterResolveHooks) hook(enrichedLocation, pluginData)
	}

	/**
	 * 执行 prepareNavigation hooks，修改导航 query 与选项
	 */
	prepareNavigation(ctx: NavigationPrepareContext): void {
		for (const hook of this.prepareNavigationHooks) hook(ctx)
	}

	/**
	 * 执行 completeNavigation hooks，扩展导航结果
	 */
	completeNavigation(ctx: NavigationCompleteContext): void {
		for (const hook of this.completeNavigationHooks) hook(ctx)
	}

	/**
	 * 执行所有 abort hooks（导航中止或失败时清理插件资源）
	 */
	runAbortHooks(pluginData: Record<string, any>): void {
		for (const hook of this.navigationAbortHooks) {
			try {
				hook(pluginData)
			} catch {
				// abort hooks should not throw
			}
		}
	}

	/**
	 * 执行 routeSync hooks，从 URL query 提取插件数据到 params
	 */
	runRouteSyncHooks(query: Record<string, string>, params: Record<string, any>): void {
		for (const hook of this.routeSyncHooks) hook(query, params)
	}

	/**
	 * 执行 appInstall hooks
	 */
	runAppInstallHooks(app: App): void {
		for (const hook of this.appInstallHooks) hook(app)
	}
}
