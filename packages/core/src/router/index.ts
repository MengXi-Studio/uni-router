import type { RouteConfig, RouteLocation, RouteLocationRaw, RouteMeta, NavigationAnimation, NavigationResult, EventChannel, Router, RouterOnError, RouterOptions, GuardRouteOptions } from '@/types'
import type { RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext } from '@/plugin'
import type { App } from 'vue'
import { RouterErrorCode } from '@/types/error'
import { NavigationFailure, RouterError, isUniApiError } from '@/errors'
import { createGuardManager, type GuardResult } from '@/guard'
import { navigateTo, replaceTo, relaunchTo, goBack } from '@/navigation'
import type { UniNavigationOptions } from '@/navigation'
import { getPageStackLength, getCurrentPagePath, getCurrentPageQuery } from '@/navigation/context'
import { createRouteState } from '@/state'
import { createRouteMatcher } from '@/matcher'
import { createParamsManager } from '@/plugins/params/params-manager'
import type { ParamsManager } from '@/plugins/params/params-manager'
import { isSameRouteLocation } from './location'
import { createRouteSync, type RouteSync } from './sync'

/**
 * 最大重定向深度，超过此值将取消导航以防止无限循环
 */
const MAX_REDIRECT_DEPTH = 10

/**
 * Hook 类型定义
 */
type EnrichLocationHook = (location: RouteLocationRaw) => RouteLocationRaw
type AfterResolveHook = (enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>) => void
type PrepareNavigationHook = (ctx: NavigationPrepareContext) => void
type CompleteNavigationHook = (ctx: NavigationCompleteContext) => void
type NavigationAbortHook = (pluginData: Record<string, any>) => void
type RouteSyncHook = (query: Record<string, string>, params: Record<string, any>) => void
type AppInstallHook = (app: App) => void

/**
 * uni-app 路由器实现类
 *
 * 提供路由导航、守卫注册、状态查询和 Vue 插件安装能力。
 * 基于 uni-app 原生导航 API（navigateTo / redirectTo / switchTab / navigateBack）实现，
 * 遵循 uni-app 的静态页面模型（pages.json）。
 *
 * 核心仅提供基础导航能力，所有扩展功能通过插件注册的 hook 实现。
 */
class UniRouter implements Router {
	private routeState = createRouteState()
	private guardManager = createGuardManager()
	private paramsManager: ParamsManager = createParamsManager(false)
	private matcher = createRouteMatcher([], true, this.paramsManager)
	private routeSync!: RouteSync
	private errorHandlers: RouterOnError[] = []
	private pendingNavigation: Promise<NavigationResult | RouteLocation | void> | null = null

	// 插件 hook 数组
	private enrichLocationHooks: EnrichLocationHook[] = []
	private afterResolveHooks: AfterResolveHook[] = []
	private prepareNavigationHooks: PrepareNavigationHook[] = []
	private completeNavigationHooks: CompleteNavigationHook[] = []
	private navigationAbortHooks: NavigationAbortHook[] = []
	private routeSyncHooks: RouteSyncHook[] = []
	private appInstallHooks: AppInstallHook[] = []

	/**
	 * @param options - 路由器初始化选项
	 */
	constructor(options: RouterOptions) {
		this.guardManager = createGuardManager(options.guardTimeout)
		this.paramsManager = createParamsManager(false)
		this.matcher = createRouteMatcher(options.routes, options.strict ?? true, this.paramsManager)
		this.routeState = createRouteState(options.readyTimeout)

		// 安装插件：插件通过 PluginContext 注册 hook
		this.installPlugins(options.plugins ?? [], options)

		// 路由同步模块需要在插件安装后创建（routeSyncHooks 已填充）
		this.routeSync = createRouteSync(
			this.routeState,
			this.matcher,
			() => this.paramsManager.cleanupStale(),
			(query, params) => {
				for (const hook of this.routeSyncHooks) {
					hook(query, params)
				}
			}
		)

		// 路由器初始化时清理所有残留 params（上次运行可能残留 storage 数据）
		this.paramsManager.cleanupAll()

		this.initRoute()
	}

	/**
	 * 安装插件并注册 hook
	 */
	private installPlugins(plugins: RouterPlugin[], options: RouterOptions): void {
		const self = this
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
				return self.routeState.getCurrentRoute()
			},
			resolve: location => self.matcher.resolve(location),
			get router() {
				return self as unknown as Router
			},
			get paramsManager() {
				return self.paramsManager
			}
		}

		for (const plugin of plugins) {
			plugin.install(context, options)
		}
	}

	/**
	 * 获取当前路由位置
	 */
	get currentRoute(): RouteLocation {
		return this.routeState.getCurrentRoute()
	}

	/**
	 * 导航到新页面
	 *
	 * 对应 uni.navigateTo（普通页面）或 uni.switchTab（TabBar 页面）。
	 * 若目标与当前位置相同，将拒绝导航并抛出 NAVIGATION_DUPLICATED 错误。
	 * 并发导航将排队执行，前一次导航完成后再开始下一次。
	 *
	 * 返回 NavigationResult，包含目标路由位置和可选的 eventChannel。
	 * eventChannel 仅在对应 uni.navigateTo 时可用，用于页面间双向通信。
	 *
	 * @param location - 目标路由位置
	 * @returns 导航结果，包含目标路由位置和可选的 eventChannel
	 * @throws {NavigationFailure} 导航被守卫中止、重复或 API 调用失败时抛出
	 */
	push(location: RouteLocationRaw): Promise<NavigationResult> {
		return this.performNavigation(location, 'push')
	}

	/**
	 * 替换当前页面
	 *
	 * 对应 uni.redirectTo（普通页面）或 uni.switchTab（TabBar 页面）。
	 * 替换 TabBar 页面时将关闭所有非 Tab 页面。
	 *
	 * @param location - 目标路由位置
	 * @returns 导航结果，包含目标路由位置和可选的 eventChannel
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	replace(location: RouteLocationRaw): Promise<NavigationResult> {
		return this.performNavigation(location, 'replace')
	}

	/**
	 * 关闭所有页面并打开目标页面
	 *
	 * 对应 uni.reLaunch（普通页面）或 uni.switchTab（TabBar 页面）。
	 * 常用于退出登录后跳转登录页、从深层页面返回首页、重置整个页面栈等场景。
	 * reLaunch 不支持动画参数，传入时将输出警告。
	 *
	 * @param location - 目标路由位置
	 * @returns 导航结果，包含目标路由位置和可选的 eventChannel
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	relaunch(location: RouteLocationRaw): Promise<NavigationResult> {
		return this.performNavigation(location, 'relaunch')
	}

	/**
	 * 返回上一页或多级页面
	 *
	 * 对应 uni.navigateBack。执行完整的导航守卫链（beforeEach → beforeResolve），
	 * 守卫可中止或重定向返回操作。
	 *
	 * 注意：物理返回键和浏览器后退不经过路由器，无法被守卫拦截。
	 * 对于原生返回，需依赖 syncRoute() + afterEach 做事后处理。
	 *
	 * @param delta - 返回的页面数，默认为 1
	 * @param options - 额外选项（AnimationPlugin 通过模块增强添加 animation 字段）
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	async back(delta: number = 1, options?: Record<string, any>): Promise<RouteLocation> {
		// 等待前一次导航完成（无论成功或失败），避免并发导航
		if (this.pendingNavigation) {
			await this.pendingNavigation.catch(() => {})
		}

		const from = this.routeState.getCurrentRoute()

		// 计算目标页面
		const pages = getCurrentPages()
		const targetIndex = pages.length - 1 - delta
		if (targetIndex < 0) {
			const failure = new NavigationFailure(from, from, RouterErrorCode.NAVIGATION_CANCELLED, 'Cannot go back: no previous page in the navigation stack')
			this.triggerErrorHandlers(failure, from, from)
			return Promise.reject(failure)
		}

		const targetPage = pages[targetIndex]
		const targetPath = `/${targetPage.route}`
		const to = this.matcher.resolve(targetPath)

		// 插件数据（back 模式不经过 enrichLocation/afterResolve，pluginData 为空）
		const pluginData: Record<string, any> = {}

		// 执行守卫链
		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, 'back', 0, pluginData)
		if (handled) return handled as unknown as Promise<RouteLocation>

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, 'back', 0, pluginData)
		if (handledResolve) return handledResolve as unknown as Promise<RouteLocation>

		// 调用 prepareNavigation hooks（插件修改 navOptions，如 AnimationPlugin 注入动画）
		const navOptions: UniNavigationOptions = {
			path: to.path,
			meta: to.meta,
			query: { ...to.query },
			animation: to.meta.animation
		}

		// 将 back() 的 options 中的 animation 注入 pluginData，供 AnimationPlugin 读取
		if (options && 'animation' in options) {
			pluginData['animation'] = { animation: (options as { animation?: NavigationAnimation }).animation }
		}

		const prepareCtx: NavigationPrepareContext = {
			to,
			from,
			mode: 'back',
			pluginData,
			query: navOptions.query!,
			options: navOptions
		}
		for (const hook of this.prepareNavigationHooks) {
			hook(prepareCtx)
		}

		const animation = navOptions.animation

		// 守卫通过，执行返回
		try {
			await goBack(delta, animation)
			this.routeSync.syncCurrentRoute()
			this.guardManager.runAfterGuards(to, from)
			return this.routeState.getCurrentRoute()
		} catch (error) {
			this.runAbortHooks(pluginData)
			const code = RouterErrorCode.NAVIGATION_API_ERROR
			const cause = isUniApiError(error) ? error : undefined
			const failure = new NavigationFailure(to, from, code, undefined, cause)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}
	}

	/**
	 * 注册全局前置守卫，在每次导航前执行
	 * @param guard - 前置守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeEach(guard: Parameters<Router['beforeEach']>[0]): () => void {
		return this.guardManager.beforeEach(guard)
	}

	/**
	 * 注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行
	 * @param guard - 解析守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeResolve(guard: Parameters<Router['beforeResolve']>[0]): () => void {
		return this.guardManager.beforeResolve(guard)
	}

	/**
	 * 注册全局后置钩子，在导航完成后执行
	 * @param guard - 后置钩子函数
	 * @returns 用于移除此钩子的函数
	 */
	afterEach(guard: Parameters<Router['afterEach']>[0]): () => void {
		return this.guardManager.afterEach(guard)
	}

	/**
	 * 获取所有已注册的路由配置列表
	 * @returns 路由配置数组的浅拷贝
	 */
	getRoutes(): RouteConfig[] {
		return this.matcher.getRoutes()
	}

	/**
	 * 检查是否存在指定名称的路由
	 * @param name - 路由名称
	 * @returns 存在时返回 true
	 */
	hasRoute(name: string): boolean {
		return this.matcher.hasRoute(name)
	}

	/**
	 * 解析路由位置为完整的 RouteLocation 对象，不执行导航
	 * @param location - 原始路由位置
	 * @returns 解析后的路由位置
	 * @throws {RouterError} 严格模式下未找到路由时抛出
	 */
	resolve(location: RouteLocationRaw): RouteLocation {
		return this.matcher.resolve(location)
	}

	/**
	 * 等待路由器初始化完成
	 * @returns 路由器就绪后 resolve 的 Promise
	 */
	isReady(): Promise<void> {
		return this.routeState.onReady()
	}

	/**
	 * 注册路由错误处理回调
	 *
	 * 当导航过程中发生错误时，所有已注册的错误处理器将被依次调用。
	 * 处理器中的异常不会影响其他处理器的执行。
	 *
	 * @param handler - 错误处理函数
	 * @returns 用于移除此处理器的函数
	 */
	onError(handler: RouterOnError): () => void {
		this.errorHandlers.push(handler)
		return () => {
			const index = this.errorHandlers.indexOf(handler)
			if (index > -1) this.errorHandlers.splice(index, 1)
		}
	}

	/**
	 * 注册路由变化监听器
	 *
	 * 当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。
	 * 与 afterEach 不同，此方法用于订阅路由状态变化，不参与导航流程控制。
	 *
	 * @param listener - 路由变化回调函数
	 * @returns 用于移除此监听器的函数
	 */
	onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void {
		return this.routeState.onRouteChange(listener)
	}

	/**
	 * 同步路由状态与实际页面栈
	 *
	 * 路由器 install 时通过全局 mixin 在每个页面 onShow 自动调用此方法。
	 * 若需在 onLoad 中获取路由信息，可手动调用（onLoad 早于 onShow）。
	 */
	syncRoute(): void {
		this.routeSync.syncRoute()
	}

	/**
	 * 对指定路由执行守卫链检查（不执行实际导航）
	 *
	 * 用于冷启动场景：用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入页面时，
	 * 页面由 uni-app 框架直接加载，不经过路由器导航，守卫（beforeEach 等）未执行。
	 * 调用此方法可对当前页面补执行守卫链，按守卫结果决定是否重定向。
	 *
	 * @param location - 目标路由位置，不传时默认检查当前路由
	 * @param options - 选项，可传入 onAbort 回调处理守卫中止
	 * @returns 守卫放行时 resolve 目标路由；重定向时跳转后 resolve；中止时 reject
	 */
	async guardRoute(location?: RouteLocationRaw, options?: GuardRouteOptions): Promise<RouteLocation> {
		const target = location ? this.matcher.resolve(location) : this.routeState.getCurrentRoute()
		const from = this.routeState.getCurrentRoute()

		// beforeEach
		const beforeResult = await this.guardManager.runBeforeGuards(target, from)
		const handled = this.handleGuardRouteResult(beforeResult, target, from, options)
		if (handled) return handled

		// beforeEnter
		const config = this.matcher.getRouteConfig(target.path)
		if (config?.beforeEnter) {
			const beforeEnterResult = await this.guardManager.runBeforeEnterGuards(target, from, config)
			const handledEnter = this.handleGuardRouteResult(beforeEnterResult, target, from, options)
			if (handledEnter) return handledEnter
		}

		// beforeResolve
		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(target, from)
		const handledResolve = this.handleGuardRouteResult(beforeResolveResult, target, from, options)
		if (handledResolve) return handledResolve

		// 所有守卫放行，不导航（页面已加载）
		return target
	}

	/**
	 * 处理 guardRoute 的守卫执行结果
	 */
	private handleGuardRouteResult(result: GuardResult, to: RouteLocation, from: RouteLocation, options?: GuardRouteOptions): Promise<RouteLocation> | null {
		if (result.type === 'abort') {
			const failure = new NavigationFailure(to, from, result.code)
			this.triggerErrorHandlers(failure, to, from)
			options?.onAbort?.(failure)
			return Promise.reject(failure)
		}

		if (result.redirect) {
			const mode = result.mode ?? 'relaunch'
			if (mode === 'replace') {
				return this.replace(result.redirect)
			} else if (mode === 'push') {
				return this.push(result.redirect) as Promise<RouteLocation>
			}
			return this.relaunch(result.redirect)
		}

		return null
	}

	/**
	 * 安装路由器到 Vue 应用实例
	 *
	 * 注册全局属性 `$router` 和 `$route`，并通过 provide/inject 机制
	 * 使组件可以通过 `useRouter()` / `useRoute()` 访问路由器。
	 * 同时注入全局 mixin，在每个页面 onShow 时自动调用 syncRoute() 同步路由状态。
	 *
	 * @param app - Vue 应用实例
	 */
	install(app: App): void {
		// 通过 provide/inject 机制提供路由器
		app.provide(ROUTER_SYMBOL, this)

		// 仅在 $router 和 $route 未被定义时设置全局属性
		if (!('$router' in app.config.globalProperties)) {
			app.config.globalProperties.$router = this
		}
		if (!('$route' in app.config.globalProperties)) {
			Object.defineProperty(app.config.globalProperties, '$route', {
				enumerable: true,
				configurable: true,
				get: () => this.currentRoute
			})
		}

		// 调用插件的 appInstall hook
		for (const hook of this.appInstallHooks) {
			hook(app)
		}

		// 通过全局 mixin 在页面 onShow 时自动同步路由状态
		const router = this
		app.mixin({
			onShow() {
				router.syncRoute()
			}
		})

		// 在 install 时标记路由器就绪
		this.routeState.markReady()
	}

	/**
	 * 根据当前页面栈初始化路由状态
	 */
	private initRoute(): void {
		if (getPageStackLength() === 0) {
			this.routeState.initCurrentRoute('/', {}, {})
			return
		}
		const currentPath = getCurrentPagePath()
		const config = this.matcher.getRouteConfig(currentPath)
		const meta: RouteMeta = config?.meta ?? {}
		const query = getCurrentPageQuery()

		this.routeState.initCurrentRoute(currentPath, meta, query)
	}

	/**
	 * 执行导航流程
	 *
	 * 处理并发导航排队、重复导航检测，并委托 executeNavigation 执行完整的守卫链和导航操作。
	 *
	 * @param location - 目标路由位置
	 * @param mode - 导航模式，push、replace 或 relaunch
	 * @returns 导航结果（push 模式包含 eventChannel）
	 * @throws {NavigationFailure} 导航失败时抛出
	 */
	private async performNavigation(location: RouteLocationRaw, mode: 'push' | 'replace' | 'relaunch'): Promise<NavigationResult> {
		// 等待前一次导航完成
		if (this.pendingNavigation) {
			await this.pendingNavigation.catch(() => {})
		}

		// 1. 调用 enrichLocation hooks（插件注入内部 key 到 query）
		let enrichedLocation = location
		for (const hook of this.enrichLocationHooks) {
			enrichedLocation = hook(enrichedLocation)
		}

		// 2. resolve 路由位置
		const to = this.matcher.resolve(enrichedLocation)
		const from = this.routeState.getCurrentRoute()

		// 3. 调用 afterResolve hooks（从 enrichedLocation 提取插件数据）
		const pluginData: Record<string, any> = {}
		for (const hook of this.afterResolveHooks) {
			hook(enrichedLocation, pluginData)
		}

		// 4. 重复导航检测
		if (mode === 'push' && isSameRouteLocation(to, from)) {
			// 调用 abort hooks 清理插件资源
			this.runAbortHooks(pluginData)
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_DUPLICATED, `Avoided redundant navigation to current location: "${to.fullPath}"`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		const navigationPromise = this.executeNavigation(to, from, mode, 0, pluginData)
		this.pendingNavigation = navigationPromise

		try {
			const result = await navigationPromise
			return result
		} finally {
			if (this.pendingNavigation === navigationPromise) {
				this.pendingNavigation = null
			}
		}
	}

	/**
	 * 执行完整的导航流程，包括守卫链和 uni API 调用
	 *
	 * 依次执行：全局前置守卫 → 路由独享守卫 → 全局解析守卫 → uni 导航 API → 全局后置钩子。
	 * 支持守卫重定向，但重定向深度超过 MAX_REDIRECT_DEPTH 时将取消导航。
	 *
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param mode - 导航模式
	 * @param redirectDepth - 当前重定向深度
	 * @param pluginData - 插件间共享数据
	 * @returns 导航结果
	 * @throws {NavigationFailure} 导航被中止、取消或 API 调用失败时抛出
	 */
	private async executeNavigation(to: RouteLocation, from: RouteLocation, mode: 'push' | 'replace' | 'relaunch' | 'back', redirectDepth: number, pluginData: Record<string, any>): Promise<NavigationResult> {
		if (redirectDepth > MAX_REDIRECT_DEPTH) {
			this.runAbortHooks(pluginData)
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_CANCELLED, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		const config = this.matcher.getRouteConfig(to.path)

		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, mode, redirectDepth, pluginData)
		if (handled) return handled

		const beforeEnterResult = config ? await this.guardManager.runBeforeEnterGuards(to, from, config) : { type: 'next' as const }
		const handledEnter = this.handleGuardResult(beforeEnterResult, to, from, mode, redirectDepth, pluginData)
		if (handledEnter) return handledEnter

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, mode, redirectDepth, pluginData)
		if (handledResolve) return handledResolve

		// 提前更新 currentRoute，确保目标页 onLoad/onShow 时 route.value 已是完整目标路由
		this.routeState.setCurrentRoute(to)

		try {
			// 构建 navigation 选项
			const queryWithKeys: Record<string, string> = { ...to.query }
			const navOptions: UniNavigationOptions = {
				path: to.path,
				meta: to.meta,
				query: queryWithKeys,
				animation: to.meta.animation
			}

			// 调用 prepareNavigation hooks（插件修改 query 和 navOptions）
			const prepareCtx: NavigationPrepareContext = {
				to,
				from,
				mode,
				pluginData,
				query: queryWithKeys,
				options: navOptions
			}
			for (const hook of this.prepareNavigationHooks) {
				hook(prepareCtx)
			}

			let nativeEventChannel: EventChannel | undefined
			if (mode === 'push') {
				nativeEventChannel = await navigateTo(navOptions)
			} else if (mode === 'replace') {
				await replaceTo(navOptions)
			} else {
				await relaunchTo(navOptions)
			}

			this.guardManager.runAfterGuards(to, from)

			// 构建结果
			const result: Record<string, any> = { ...to }
			if (mode === 'push') {
				result.eventChannel = nativeEventChannel
			}

			// 调用 completeNavigation hooks（插件扩展 result）
			const completeCtx: NavigationCompleteContext = {
				to,
				mode,
				pluginData,
				nativeEventChannel,
				result
			}
			for (const hook of this.completeNavigationHooks) {
				hook(completeCtx)
			}

			return result as NavigationResult
		} catch (error) {
			// 导航 API 失败，回退 currentRoute 到来源路由，并调用 abort hooks 清理插件资源
			this.routeState.setCurrentRoute(from)
			this.runAbortHooks(pluginData)
			const code = RouterErrorCode.NAVIGATION_API_ERROR
			const cause = isUniApiError(error) ? error : undefined
			const failure = new NavigationFailure(to, from, code, undefined, cause)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}
	}

	/**
	 * 处理守卫执行结果
	 *
	 * 根据守卫返回的结果决定后续行为：
	 * - abort: 中止导航并抛出 NavigationFailure
	 * - next + redirect: 递归执行重定向导航
	 * - next: 继续执行后续守卫
	 */
	private handleGuardResult(
		result: GuardResult,
		to: RouteLocation,
		from: RouteLocation,
		mode: 'push' | 'replace' | 'relaunch' | 'back',
		redirectDepth: number,
		pluginData: Record<string, any>
	): Promise<NavigationResult> | null {
		if (result.type === 'abort') {
			// 中止时调用 abort hooks 清理插件资源
			this.runAbortHooks(pluginData)
			const failure = new NavigationFailure(to, from, result.code)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		if (result.redirect) {
			// 重定向时对新的 location 执行 enrichLocation hooks
			let enrichedRedirect = result.redirect
			for (const hook of this.enrichLocationHooks) {
				enrichedRedirect = hook(enrichedRedirect)
			}

			const redirectTarget = this.matcher.resolve(enrichedRedirect)

			// 对重定向的 enrichedLocation 执行 afterResolve hooks
			const redirectPluginData = { ...pluginData }
			for (const hook of this.afterResolveHooks) {
				hook(enrichedRedirect, redirectPluginData)
			}

			// 重定向方式：守卫指定优先，否则沿用原始导航方式
			const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
			return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, redirectPluginData)
		}

		return null
	}

	/**
	 * 执行所有 abort hooks
	 */
	private runAbortHooks(pluginData: Record<string, any>): void {
		for (const hook of this.navigationAbortHooks) {
			try {
				hook(pluginData)
			} catch {
				// abort hooks should not throw
			}
		}
	}

	/**
	 * 触发所有已注册的错误处理器
	 */
	private triggerErrorHandlers(error: RouterError, to: RouteLocation, from: RouteLocation): void {
		for (const handler of this.errorHandlers) {
			try {
				handler(error, to, from)
			} catch {
				// error handlers should not throw
			}
		}
	}
}

/**
 * 路由器注入键，用于 Vue 的 provide/inject 机制
 *
 * @internal 内部使用，不应在应用代码中直接引用
 */
export const ROUTER_SYMBOL = Symbol('uni-router')

/**
 * 创建 uni-app 路由器实例
 *
 * @param options - 路由器初始化选项
 * @returns 路由器实例
 *
 * @example
 * ```ts
 * import { createRouter, Params, Animation, Channel, Interceptor } from '@meng-xi/uni-router'
 *
 * const router = createRouter({
 *   routes: [
 *     { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
 *     { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
 *     { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
 *   ],
 *   plugins: [Params, Animation, Channel, Interceptor],
 * })
 *
 * // 注册到 Vue 应用
 * app.use(router)
 *
 * // 导航
 * await router.push('/pages/about/about')
 * await router.push({ name: 'about', query: { id: '1' } })
 * await router.back()
 * ```
 */
export function createRouter(options: RouterOptions): Router {
	return new UniRouter(options)
}
