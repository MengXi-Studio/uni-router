import type { RouteConfig, RouteLocation, RouteLocationRaw, RouteMeta, NavigationAnimation, NavigationResult, EventChannel, Router, RouterOnError, RouterOptions, GuardRouteOptions } from '@/types'
import type { RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext } from '@/types/plugin'
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
import { warn } from '@/utils/general'
import { buildFullPath, createRouteLocation, getPlatform } from '@/utils'
import { isSameRouteLocation } from './location'
import { createRouteSync } from './sync'
import type { RouteSync, EnrichLocationHook, AfterResolveHook, PrepareNavigationHook, CompleteNavigationHook, NavigationAbortHook, RouteSyncHook, AppInstallHook } from './type'

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
	private options: RouterOptions
	private routeState = createRouteState()
	private guardManager = createGuardManager()
	private paramsManager: ParamsManager = createParamsManager(false)
	private matcher = createRouteMatcher([], true, this.paramsManager)
	private routeSync!: RouteSync
	private errorHandlers: RouterOnError[] = []
	private pendingNavigation: Promise<NavigationResult | RouteLocation | void> | null = null
	private installedPlugins: Set<string> = new Set()

	/** 返回守卫执行中标记：onBackPress 手动返回时置位，避免递归 */
	private backGuardRunning = false

	/** H5 平台返回守卫：当前页面 URL，用于判断 popstate 是否为后退 */
	private h5BackUrl = ''

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
		this.options = options
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
			},
			hasPlugin(name: string) {
				return self.installedPlugins.has(name)
			}
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
		if (options && 'animation' in options && !this.installedPlugins.has('animation')) {
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
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_ABORTED)
			this.guardManager.runAfterGuards(to, from, failure)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
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
			animation: this.installedPlugins.has('animation') ? to.meta.animation : undefined
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
		// 置位 backGuardRunning：执行 goBack 时会再次触发 onBackPress，据此放行避免递归
		this.backGuardRunning = true
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
			this.guardManager.runAfterGuards(to, from, failure)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		} finally {
			this.backGuardRunning = false
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
		return this.installedPlugins.has(name)
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
	 * 覆盖 App 端物理返回键、顶部导航栏返回按钮、外部 `uni.navigateBack` 调用。
	 * 返回 `true` 阻止默认返回并异步执行返回守卫链；返回 `false` / `undefined` 放行默认返回。
	 *
	 * **递归保护**：路由器发起的返回（`router.back()` 或本方法守卫放行后的手动返回）会再次触发
	 * `onBackPress`，通过 `backGuardRunning` 标记放行，避免守卫重复执行与死循环。
	 *
	 * **平台限制**：仅 App 平台接入。iOS 侧滑返回不触发 `onBackPress`，
	 * 需配合 `app.setSideSlipGesture` 禁用手势后由本方法接管；
	 * H5 浏览器后退由 popstate 事件接入（见 {@link handleH5PopState}），
	 * 小程序返回不支持拦截。
	 *
	 * @returns 返回 true 阻止默认返回，返回 false / undefined 放行
	 */
	handleBackPress(): boolean | undefined {
		// 仅 App 平台拦截；H5 / 小程序保持默认返回行为
		if (!getPlatform().isApp) return undefined

		// 路由器发起的返回（守卫已通过）→ 放行，避免递归
		if (this.backGuardRunning) return false

		// 根页面（无上级页面）→ 放行默认行为（如 Android 物理键退出应用）
		const pages = getCurrentPages()
		if (pages.length < 2) return false

		// 阻止默认返回，异步执行返回守卫链，放行后手动返回
		this.runBackGuardFromBackPress().catch(() => {
			// 守卫异常已由 onError 处理
		})
		return true
	}

	/**
	 * 由 onBackPress 触发的返回守卫流程（异步执行，App 端）
	 *
	 * 执行顺序：onBeforeBack → beforeEach → beforeResolve，全部放行后执行 `uni.navigateBack`。
	 * 由于 `onBackPress` 必须同步返回，本方法以 fire-and-forget 方式运行；
	 * 守卫放行后手动返回时会再次触发 `onBackPress`，由 `backGuardRunning` 放行。
	 */
	private async runBackGuardFromBackPress(): Promise<void> {
		const from = this.routeState.getCurrentRoute()
		const pages = getCurrentPages()
		const targetPage = pages[pages.length - 2]
		if (!targetPage) return
		const to = this.matcher.resolve(`/${targetPage.route}`)
		await this.runBackGuardChain(to, from, () => this.executeBack())
	}

	/**
	 * H5 平台返回守卫入口（由浏览器 popstate 事件触发，注册见 {@link install}）
	 *
	 * 覆盖浏览器后退按钮 / 后退手势。popstate 触发时浏览器已完成后退，
	 * 采用「撤销后退 → 执行返回守卫 → 守卫放行后重新后退」策略：
	 * 1. 记录当前页 URL（`h5BackUrl`），popstate 后 URL 已变化说明发生了后退；
	 * 2. `history.go(1)` 恢复当前页（触发二次 popstate，命中「回到当前页」分支放行）；
	 * 3. 同步捕获 to/from 执行返回守卫链（避免依赖 uni-app 处理 popstate 后的页面栈时序）；
	 * 4. 守卫放行后经 {@link executeBack} 重新后退（再次触发 popstate，由 `backGuardRunning` 放行）。
	 *
	 * 根页面（无上级页面）不拦截，保留浏览器默认行为（离开站点 / 回上一站点）。
	 */
	private handleH5PopState(): void {
		// 路由器发起的返回（守卫已通过）→ 放行，并更新当前页 URL
		if (this.backGuardRunning) {
			this.h5BackUrl = location.href
			return
		}

		// 恢复当前页的二次 popstate / 前进回当前页 → 放行
		if (location.href === this.h5BackUrl) return

		// 根页面（无上级页面）→ 放行浏览器默认行为
		const pages = getCurrentPages()
		if (pages.length < 2) return

		// 撤销浏览器后退，恢复当前页
		history.go(1)

		// 同步捕获 to/from 后执行返回守卫链
		const from = this.routeState.getCurrentRoute()
		const targetPage = pages[pages.length - 2]
		if (!targetPage) return
		const to = this.matcher.resolve(`/${targetPage.route}`)
		this.runBackGuardChain(to, from, () => this.executeBack()).catch(() => {
			// 守卫异常已由 onError 处理
		})
	}

	/**
	 * 执行返回守卫链（onBeforeBack → beforeEach → beforeResolve）
	 *
	 * 全部放行后调用 onPass 执行真正的返回，随后同步路由状态并触发后置钩子。
	 * 任一守卫返回 false 时中止（NAVIGATION_ABORTED）；重定向 / 异常行为与完整导航一致。
	 *
	 * @param to - 返回目标路由（上一页）
	 * @param from - 当前正要离开的路由
	 * @param onPass - 守卫全部放行后执行返回的回调
	 */
	private async runBackGuardChain(to: RouteLocation, from: RouteLocation, onPass: () => Promise<void>): Promise<void> {
		// 返回守卫（onBeforeBack）
		const backPass = await this.guardManager.runBeforeBackGuards(to, from)
		if (!backPass) {
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_ABORTED)
			this.guardManager.runAfterGuards(to, from, failure)
			this.triggerErrorHandlers(failure, to, from)
			return
		}

		// 前置守卫与解析守卫（复用完整导航的守卫结果处理，支持中止/重定向）
		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, 'back', 0, {})
		if (handled) return

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, 'back', 0, {})
		if (handledResolve) return

		// 守卫通过，执行返回
		await onPass()
		this.routeSync.syncCurrentRoute()
		this.guardManager.runAfterGuards(to, from)
	}

	/**
	 * 守卫放行后执行真正的返回（uni.navigateBack）
	 *
	 * 置位 `backGuardRunning`：App 端再次触发 onBackPress、H5 端再次触发 popstate 时据此放行，
	 * 避免守卫重复执行与死循环。
	 */
	private async executeBack(): Promise<void> {
		this.backGuardRunning = true
		try {
			await goBack(1)
		} finally {
			this.backGuardRunning = false
		}
	}

	/**
	 * 按当前路由动态设置 iOS 侧滑返回手势（由全局 mixin 在页面 onShow 时调用）
	 *
	 * 通过 `app.setSideSlipGesture` 回调决定当前页面的 popGesture：
	 * - `'none'`：禁用侧滑返回，使侧滑返回无法绕过守卫（配合 onBackPress 拦截）
	 * - `'close'`：开启原生侧滑返回，保留原生手势体验（侧滑不经过守卫）
	 *
	 * 仅 iOS 平台生效；未配置 `app.setSideSlipGesture` 时不干预手势。
	 */
	private applySideSlipGesture(): void {
		const config = this.options?.app?.setSideSlipGesture
		// 仅 iOS 平台存在侧滑返回手势；Android 使用物理返回键，由 onBackPress 拦截
		if (typeof config !== 'function' || !getPlatform().isIOS) return
		const value = config(this.routeState.getCurrentRoute())
		if (value === 'none' || value === 'close') {
			plus.webview.currentWebview()?.setStyle({ popGesture: value })
		}
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
			this.h5BackUrl = location.href
			window.addEventListener('popstate', () => this.handleH5PopState())
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
				animation: this.installedPlugins.has('animation') ? to.meta.animation : undefined
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
			this.guardManager.runAfterGuards(to, from, failure)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
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
			this.runAbortHooks(pluginData)
			const failure = new NavigationFailure(to, from, result.code)
			this.guardManager.runAfterGuards(to, from, failure)
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
	 * 对路由位置执行 routeSync hooks，将内部 key（如 __nav_id）从 query 提取到 params
	 *
	 * 用于导航时 setCurrentRoute 前预处理，确保目标页 onLoad 时 params 已包含插件数据。
	 * 同时从 query 中移除内部 key，避免暴露给用户。
	 */
	private applySyncHooks(to: RouteLocation): RouteLocation {
		const query = { ...to.query }
		const params: Record<string, any> = { ...to.params }
		for (const hook of this.routeSyncHooks) {
			hook(query, params)
		}
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

		if ('params' in loc && loc.params && !this.installedPlugins.has('params')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'ParamsPlugin is required to use params. Add ParamsPlugin to createRouter({ plugins: [ParamsPlugin] }).')
		}

		if ('events' in loc && loc.events && !this.installedPlugins.has('channel')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'ChannelPlugin is required to use events. Add ChannelPlugin to createRouter({ plugins: [ChannelPlugin] }).')
		}

		if ('animation' in loc && loc.animation && !this.installedPlugins.has('animation')) {
			throw new RouterError(RouterErrorCode.PLUGIN_REQUIRED, 'AnimationPlugin is required to use animation. Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).')
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
