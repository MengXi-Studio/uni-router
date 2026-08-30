import type { RouteConfig, RouteLocation, RouteLocationRaw, RouteMeta, NavigationAnimation, NavigationResult, EventChannel, Router, RouterOnError, RouterOptions, GuardRouteOptions, UniApiError } from '@/types'
import type { NavigationPrepareContext, NavigationCompleteContext } from '@/types/plugin'
import type { App } from 'vue'
import { RouterErrorCode } from '@/enums'
import { MAX_REDIRECT_DEPTH, ROUTER_SYMBOL } from '@/constants'
import { NavigationFailure, RouterError, isUniApiError } from '@/errors'
import { createGuardManager, type GuardResult } from '@/guard'
import { navigateTo, replaceTo, relaunchTo, goBack } from '@/navigation'
import type { UniNavigationOptions } from '@/navigation'
import { getPageStackLength, getCurrentPagePath, getCurrentPageQuery } from '@/navigation/context'
import { createRouteState } from '@/state'
import { createRouteMatcher } from '@/matcher'
import { createParamsManager } from '@/plugins/params/params-manager'
import type { ParamsManager } from '@/plugins/params/type'
import { buildFullPath, createRouteLocation, getPlatform } from '@/utils'
import { isSameRouteLocation } from './location'
import { createRouteSync } from './sync'
import { PluginHookManager } from './plugin-hooks'
import { BackGuardManager } from './back-guard'
import type { RouteSync } from './type'

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
	private pluginHooks: PluginHookManager
	private backGuard: BackGuardManager

	/**
	 * @param options - 路由器初始化选项
	 */
	constructor(options: RouterOptions) {
		this.guardManager = createGuardManager(options.guardTimeout)
		this.paramsManager = createParamsManager(false)
		this.matcher = createRouteMatcher(options.routes, options.strict ?? true, this.paramsManager)
		this.routeState = createRouteState(options.readyTimeout)

		// 插件 hook 管理器：安装插件，插件通过 PluginContext 注册 hook
		this.pluginHooks = new PluginHookManager({
			getCurrentRoute: () => this.routeState.getCurrentRoute(),
			resolve: location => this.matcher.resolve(location),
			router: this,
			paramsManager: this.paramsManager
		})
		this.pluginHooks.install(options.plugins ?? [], options)

		// 路由同步模块需要在插件安装后创建（routeSyncHooks 已填充）
		this.routeSync = createRouteSync(
			this.routeState,
			this.matcher,
			() => this.paramsManager.cleanupStale(),
			(query, params) => this.pluginHooks.runRouteSyncHooks(query, params)
		)

		// 返回守卫管理器：拦截 App 原生返回 / H5 popstate / iOS 侧滑
		this.backGuard = new BackGuardManager({
			guardManager: this.guardManager,
			options,
			getCurrentRoute: () => this.routeState.getCurrentRoute(),
			resolve: path => this.matcher.resolve(path),
			syncCurrentRoute: () => this.routeSync.syncCurrentRoute(),
			handleGuardResult: (result, to, from) => this.handleGuardResult(result, to, from, 'back', 0, {}),
			onNavigationFailure: (failure, to, from) => this.triggerErrorHandlers(failure, to, from)
		})

		// 路由器初始化时清理所有残留 params（上次运行可能残留 storage 数据）
		this.paramsManager.cleanupAll()

		this.initRoute()
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

		// 检查用户是否使用了动画但未安装 AnimationPlugin
		if (options && 'animation' in options && !this.pluginHooks.hasPlugin('animation')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'AnimationPlugin is required to use animation in back(). Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).')
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

		// 执行返回守卫（onBeforeBack），任一返回 false 则阻止返回
		const backPass = await this.guardManager.runBeforeBackGuards(to, from)
		if (!backPass) {
			return this.failNavigation(to, from, RouterErrorCode.NAVIGATION_ABORTED)
		}

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
			// meta.animation 需要 AnimationPlugin（未注册时不生效，与 location.animation 门控一致）
			animation: this.pluginHooks.hasPlugin('animation') ? to.meta.animation : undefined
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
		this.pluginHooks.prepareNavigation(prepareCtx)

		const animation = navOptions.animation

		// 守卫通过，执行返回
		// 置位 backGuardRunning：执行 goBack 时会再次触发 onBackPress，据此放行避免递归
		this.backGuard.setRouterBackRunning(true)
		try {
			await goBack(delta, animation)
			this.routeSync.syncCurrentRoute()
			this.guardManager.runAfterGuards(to, from)
			return this.routeState.getCurrentRoute()
		} catch (error) {
			this.pluginHooks.runAbortHooks(pluginData)
			return this.failNavigation(to, from, RouterErrorCode.NAVIGATION_API_ERROR, undefined, isUniApiError(error) ? error : undefined)
		} finally {
			this.backGuard.setRouterBackRunning(false)
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
	 * 注册全局返回守卫，在返回操作触发时执行
	 *
	 * 覆盖 App 端物理返回键、顶部导航栏返回按钮、`uni.navigateBack`
	 * （通过全局 mixin 的 onBackPress 接入，见 {@link handleBackPress}），
	 * 以及 H5 端浏览器后退按钮 / 后退手势（通过 popstate 事件接入，见 {@link handleH5PopState}）。
	 * 支持异步（Promise），返回 `false` 阻止返回，`true` / `undefined` 放行。
	 *
	 * @param guard - 返回守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	onBeforeBack(guard: Parameters<Router['onBeforeBack']>[0]): () => void {
		return this.guardManager.onBeforeBack(guard)
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
	 * 检查指定插件是否已注册
	 *
	 * 插件未注册时使用其功能将抛出 PLUGIN_REQUIRED 错误。
	 *
	 * @param name - 插件名称
	 * @returns 已注册时返回 true
	 */
	hasPlugin(name: string): boolean {
		return this.pluginHooks.hasPlugin(name)
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
	 * 处理页面 onBackPress 生命周期（由全局 mixin 注入到每个页面）
	 *
	 * 委托给 {@link BackGuardManager}，覆盖 App 端物理返回键 / 导航栏返回 / navigateBack。
	 *
	 * @returns 返回 true 阻止默认返回，返回 false / undefined 放行
	 */
	handleBackPress(): boolean | undefined {
		return this.backGuard.handleBackPress()
	}

	/**
	 * 按当前路由动态设置 iOS 侧滑返回手势（由全局 mixin 在页面 onShow 时调用）
	 *
	 * 委托给 {@link BackGuardManager}，需配置 `app.setSideSlipGesture`，仅 iOS 生效。
	 */
	applySideSlipGesture(): void {
		this.backGuard.applySideSlipGesture()
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
		this.pluginHooks.runAppInstallHooks(app)

		// 通过全局 mixin 在页面 onShow 时自动同步路由状态，
		// 并通过 onBackPress 接入返回守卫（App 端物理返回键 / 导航栏返回 / navigateBack）
		// 注意：不使用 #ifdef 条件编译——npm 发布产物由 tsup 构建，不会处理该注释；
		// 平台判断在 handleBackPress / applySideSlipGesture 内部通过 getPlatform() 运行时完成。
		const router = this
		app.mixin({
			onShow() {
				router.syncRoute()
				router.applySideSlipGesture()
			},
			onBackPress() {
				return router.handleBackPress()
			}
		})

		// H5 平台通过浏览器 popstate 事件接入返回守卫（后退按钮 / 后退手势）
		if (getPlatform().isH5) {
			this.backGuard.setH5BackUrl(location.href)
			window.addEventListener('popstate', () => this.backGuard.handleH5PopState())
		}

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

		// 检查用户是否使用了插件功能但未安装对应插件
		this.requirePluginForLocation(location)

		// 1. 调用 enrichLocation hooks（插件注入内部 key 到 query）
		const enrichedLocation = this.pluginHooks.enrichLocation(location)

		// 2. resolve 路由位置
		const to = this.matcher.resolve(enrichedLocation)
		const from = this.routeState.getCurrentRoute()

		// 3. 调用 afterResolve hooks（从 enrichedLocation 提取插件数据）
		const pluginData: Record<string, any> = {}
		this.pluginHooks.afterResolve(enrichedLocation, pluginData)

		// 4. 重复导航检测
		if (mode === 'push' && isSameRouteLocation(to, from)) {
			// 调用 abort hooks 清理插件资源
			this.pluginHooks.runAbortHooks(pluginData)
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
			this.pluginHooks.runAbortHooks(pluginData)
			return this.failNavigation(to, from, RouterErrorCode.NAVIGATION_CANCELLED, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`)
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

		// 守卫通过，提前更新 currentRoute，确保目标页 onLoad/onShow 时 route.value 已是完整目标路由
		// 在设置前先执行 routeSync hooks，将 __nav_id 等内部 key 从 query 提取到 params
		// 确保目标页 onLoad 中 usePageChannel() 能正确读取 params.__navId
		const toWithSyncedParams = this.applySyncHooks(to)
		this.routeState.setCurrentRoute(toWithSyncedParams)

		try {
			// 构建 navigation 选项
			const queryWithKeys: Record<string, string> = { ...to.query }
			const navOptions: UniNavigationOptions = {
				path: to.path,
				meta: to.meta,
				query: queryWithKeys,
				// meta.animation 需要 AnimationPlugin（与 location.animation 的 PLUGIN_REQUIRED 门控保持一致），未注册时不生效
				animation: this.pluginHooks.hasPlugin('animation') ? to.meta.animation : undefined
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
			this.pluginHooks.prepareNavigation(prepareCtx)

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
			this.pluginHooks.completeNavigation(completeCtx)

			return result as NavigationResult
		} catch (error) {
			// 导航 API 失败，回退 currentRoute 到来源路由，并调用 abort hooks 清理插件资源
			this.routeState.setCurrentRoute(from)
			this.pluginHooks.runAbortHooks(pluginData)
			return this.failNavigation(to, from, RouterErrorCode.NAVIGATION_API_ERROR, undefined, isUniApiError(error) ? error : undefined)
		}
	}

	/**
	 * 处理守卫执行结果
	 *
	 * 根据守卫返回的结果决定后续行为：
	 * - abort: 中止导航并抛出 NavigationFailure
	 * - allow + redirect: 递归执行重定向导航
	 * - allow: 继续执行后续守卫
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
			// 中止时调用 abort hooks 清理插件资源，并触发 afterEach 通知失败
			this.pluginHooks.runAbortHooks(pluginData)
			return this.failNavigation(to, from, result.code)
		}

		if (result.redirect) {
			// 重定向时对新的 location 执行 enrichLocation hooks
			const enrichedRedirect = this.pluginHooks.enrichLocation(result.redirect)

			const redirectTarget = this.matcher.resolve(enrichedRedirect)

			// 对重定向的 enrichedLocation 执行 afterResolve hooks
			const redirectPluginData = { ...pluginData }
			this.pluginHooks.afterResolve(enrichedRedirect, redirectPluginData)

			// 重定向方式：守卫指定优先，否则沿用原始导航方式
			const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
			return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, redirectPluginData)
		}

		return null
	}

	/**
	 * 对路由位置执行 routeSync hooks，将内部 key（如 __nav_id）从 query 提取到 params
	 *
	 * 用于导航时 setCurrentRoute 前预处理，确保目标页 onLoad 时 params 已包含插件数据。
	 * 同时从 query 中移除内部 key，避免暴露给用户。
	 */
	private applySyncHooks(to: RouteLocation): RouteLocation {
		const query = { ...to.query }
		const params: Record<string, any> = { ...to.params }
		this.pluginHooks.runRouteSyncHooks(query, params)
		// 如果 hooks 修改了 query，需要重建 fullPath
		const fullPath = buildFullPath(to.path, query)
		return createRouteLocation({ ...to, query, fullPath, params: Object.keys(params).length > 0 ? params : undefined })
	}

	/**
	 * 检查路由位置是否使用了插件功能但未安装对应插件
	 *
	 * 当用户传入 params / events / animation 但对应插件未注册时，
	 * 抛出 PLUGIN_REQUIRED 错误，帮助用户快速定位问题。
	 */
	private requirePluginForLocation(location: RouteLocationRaw): void {
		if (typeof location === 'string') return
		const loc = location as Record<string, any>

		if ('params' in loc && loc.params && !this.pluginHooks.hasPlugin('params')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'ParamsPlugin is required to use params. Add ParamsPlugin to createRouter({ plugins: [ParamsPlugin] }).')
		}

		if ('events' in loc && loc.events && !this.pluginHooks.hasPlugin('channel')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'ChannelPlugin is required to use events. Add ChannelPlugin to createRouter({ plugins: [ChannelPlugin] }).')
		}

		if ('animation' in loc && loc.animation && !this.pluginHooks.hasPlugin('animation')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'AnimationPlugin is required to use animation. Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).')
		}
	}

	/**
	 * 构造导航失败并统一处理：触发 afterEach + 错误处理器，然后 reject
	 *
	 * 复用统一错误处理样板，避免各导航分支重复构造 NavigationFailure。
	 *
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param code - 错误码
	 * @param message - 错误信息（可选）
	 * @param cause - uni API 失败原因（可选，仅 NAVIGATION_API_ERROR 时存在）
	 * @returns 始终 reject 的 Promise
	 */
	private failNavigation(to: RouteLocation, from: RouteLocation, code: RouterErrorCode, message?: string, cause?: UniApiError): Promise<never> {
		const failure = new NavigationFailure(to, from, code, message, cause)
		this.guardManager.runAfterGuards(to, from, failure)
		this.triggerErrorHandlers(failure, to, from)
		return Promise.reject(failure)
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
