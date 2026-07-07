import type { RouteConfig, RouteLocation, RouteLocationRaw, RouteMeta, NavigationAnimation, NavigationResult, EventChannel, EventListeners, Router, RouterOnError, RouterOptions, GuardRouteOptions } from '@/types'
import type { App } from 'vue'
import { RouterErrorCode } from '@/types/error'
import { NavigationFailure, RouterError, isUniApiError } from '@/errors'
import { createGuardManager, type GuardResult } from '@/guard'
import { navigateTo, replaceTo, relaunchTo, goBack } from '@/navigation'
import { getPageStackLength, getCurrentPagePath, getCurrentPageQuery } from '@/navigation/context'
import { createRouteState } from '@/state'
import { createRouteMatcher } from '@/matcher'
import { installInterceptors, removeInterceptors } from '@/interceptor'
import { createParamsManager, PARAMS_KEY } from '@/params'
import type { ParamsManager } from '@/params'
import { UniEventChannel, generateNavId, registerChannel, destroyChannel } from '@/channel'
import { warn } from '@/utils'
import { extractAnimation, extractEvents, extractParamsKey, extractNavId, enrichLocationWithParams, enrichLocationWithNavId, isSameRouteLocation } from './location'
import { createRouteSync, type RouteSync } from './sync'

/**
 * 最大重定向深度，超过此值将取消导航以防止无限循环
 */
const MAX_REDIRECT_DEPTH = 10

/**
 * uni-app 路由器实现类
 *
 * 提供路由导航、守卫注册、状态查询和 Vue 插件安装能力。
 * 基于 uni-app 原生导航 API（navigateTo / redirectTo / switchTab / navigateBack）实现，
 * 遵循 uni-app 的静态页面模型（pages.json）。
 */
class UniRouter implements Router {
	private routeState = createRouteState()
	private guardManager = createGuardManager()
	private paramsManager: ParamsManager = createParamsManager(false)
	private matcher = createRouteMatcher([], true, this.paramsManager)
	private routeSync!: RouteSync
	private errorHandlers: RouterOnError[] = []
	private pendingNavigation: Promise<NavigationResult | RouteLocation | void> | null = null
	private _interceptUniApi: boolean
	private _useUniEventChannel: boolean

	/**
	 * @param options - 路由器初始化选项
	 */
	constructor(options: RouterOptions) {
		this.guardManager = createGuardManager(options.guardTimeout)
		this.paramsManager = createParamsManager(options.paramsPersistent ?? false)
		this.matcher = createRouteMatcher(options.routes, options.strict ?? true, this.paramsManager)
		this.routeState = createRouteState(options.readyTimeout)
		this.routeSync = createRouteSync(this.routeState, this.matcher, this.paramsManager)
		this._interceptUniApi = options.interceptUniApi ?? false
		this._useUniEventChannel = options.useUniEventChannel ?? false

		// 路由器初始化时清理所有残留 params（上次运行可能残留 storage 数据）
		this.paramsManager.cleanupAll()

		this.initRoute()
		if (this._interceptUniApi) {
			installInterceptors(this)
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
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	replace(location: RouteLocationRaw): Promise<RouteLocation> {
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
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	relaunch(location: RouteLocationRaw): Promise<RouteLocation> {
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
	 * @param animation - 导航动画（仅 App 端生效），覆盖 meta.animation
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	async back(delta: number = 1, animation?: NavigationAnimation): Promise<RouteLocation> {
		// 等待前一次导航完成（无论成功或失败），避免并发导航
		// 错误已通过 onError 机制通知，此处无需再处理
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

		// 动画优先级：调用时传入 > 目标页面 meta.animation > uni 默认值
		const effectiveAnimation = animation ?? to.meta.animation

		// 执行守卫链
		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, 'back', 0, effectiveAnimation)
		if (handled) return handled as unknown as Promise<RouteLocation>

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, 'back', 0, effectiveAnimation)
		if (handledResolve) return handledResolve as unknown as Promise<RouteLocation>

		// 守卫通过，执行返回
		try {
			await goBack(delta, effectiveAnimation)
			this.routeSync.syncCurrentRoute()
			this.guardManager.runAfterGuards(to, from)
			return this.routeState.getCurrentRoute()
		} catch (error) {
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
	 *
	 * 当页面通过浏览器后退、物理返回键等非路由器方式切换时，
	 * 路由器的 currentRoute 可能与实际页面不同步。
	 * 调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。
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
	 * - 守卫放行：不执行任何导航，resolve 目标路由
	 * - 守卫重定向：按守卫指定的方式（默认 relaunch）跳转到重定向目标
	 * - 守卫中止：调用 onAbort 回调（若提供），并 reject NavigationFailure
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
	 *
	 * 与 handleGuardResult 不同，此方法在守卫放行时不执行导航（页面已加载），
	 * 仅在重定向时委托给 push/replace/relaunch 执行实际跳转。
	 *
	 * @param result - 守卫执行结果
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param options - guardRoute 选项
	 * @returns 中止或重定向时返回 Promise，放行时返回 null
	 */
	private handleGuardRouteResult(result: GuardResult, to: RouteLocation, from: RouteLocation, options?: GuardRouteOptions): Promise<RouteLocation> | null {
		if (result.type === 'abort') {
			const failure = new NavigationFailure(to, from, result.code)
			this.triggerErrorHandlers(failure, to, from)
			options?.onAbort?.(failure)
			return Promise.reject(failure)
		}

		if (result.redirect) {
			// 冷启动重定向：默认 relaunch（清空栈，避免返回受保护页面）
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
		// 通过 provide/inject 机制提供路由器，使 useRouter()/useRoute() 可用
		app.provide(ROUTER_SYMBOL, this)

		// 仅在 $router 和 $route 未被定义时设置全局属性
		// 避免与 uni-app H5 内置的 vue-router 冲突
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

		if (this._interceptUniApi) {
			// app.onUnmount 是 Vue 3.5+ API，uni-app 可能不支持
			// 在 uni-app 中应用不会真正卸载，拦截器无需清理
			if (typeof app.onUnmount === 'function') {
				app.onUnmount(() => removeInterceptors())
			}
		}

		// 通过全局 mixin 在页面 onShow 时自动同步路由状态
		// syncRoute 有去重（路径+query 相同则跳过），mixin 钩子先于组件自身钩子执行
		const router = this
		app.mixin({
			onShow() {
				router.syncRoute()
			}
		})

		// 在 install 时标记路由器就绪，确保 isReady() 回调在所有插件安装完成后执行
		this.routeState.markReady()
	}

	/**
	 * 根据当前页面栈初始化路由状态
	 *
	 * 若页面栈为空（如首次启动），将路由初始化为根路径 `/`。
	 * 否则从当前页面获取路径、元信息和查询参数。
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
		// 等待前一次导航完成（无论成功或失败），避免并发导航
		// 错误已通过 onError 机制通知，此处无需再处理
		if (this.pendingNavigation) {
			await this.pendingNavigation.catch(() => {})
		}

		// 在 resolve 前处理 params：存入 ParamsManager 并将 key 注入 location
		let enrichedLocation = enrichLocationWithParams(location, this.paramsManager)

		// useUniEventChannel 模式：生成 navId 并注入 query，使所有导航方式都支持页面通信
		let navId: string | undefined
		let internalChannel: UniEventChannel | undefined
		const events = extractEvents(location)
		if (this._useUniEventChannel) {
			navId = generateNavId()
			enrichedLocation = enrichLocationWithNavId(enrichedLocation, navId)
			internalChannel = new UniEventChannel(navId)
			// 注册调用方传入的 events 监听器到内置通道
			if (events) {
				for (const [event, handler] of Object.entries(events)) {
					internalChannel.on(event, handler)
				}
			}
			// 注册到全局 registry，供目标页面 usePageChannel() 复用
			registerChannel(navId, internalChannel)
		}

		const to = this.matcher.resolve(enrichedLocation)
		const from = this.routeState.getCurrentRoute()
		// 从原始路由位置中提取动画参数和事件监听器（resolve 会丢弃这些字段）
		const animation = extractAnimation(location)
		// 提取 params key：matcher.resolve 会从 query 中移除 __params_key，
		// 但实际导航 URL 需要保留它，以便 back() 时 syncCurrentRoute 能从 URL 重建 params
		const paramsKey = extractParamsKey(enrichedLocation)
		// 提取 navId：matcher.resolve 会从 query 中移除 __nav_id，
		// 但实际导航 URL 需要保留它，以便目标页面 syncCurrentRoute 能从 URL 重建通道
		const resolvedNavId = navId ?? extractNavId(enrichedLocation)

		// 非 useUniEventChannel 模式下 events 仅在 push 模式有效，其他模式发出警告并忽略
		if (events && mode !== 'push' && !this._useUniEventChannel) {
			warn(`uni.${mode === 'replace' ? 'redirectTo' : 'reLaunch'} does not support events. The events option will be ignored.`)
		}

		if (mode === 'push' && isSameRouteLocation(to, from)) {
			// 重复导航时清理已注册的通道，避免内存泄漏
			if (navId) destroyChannel(navId)
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_DUPLICATED, `Avoided redundant navigation to current location: "${to.fullPath}"`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		// useUniEventChannel 模式下不向 uni.navigateTo 传递 events（避免原生通道干扰）
		const effectiveEvents = this._useUniEventChannel ? undefined : (mode === 'push' ? events : undefined)
		const navigationPromise = this.executeNavigation(to, from, mode, 0, animation, effectiveEvents, paramsKey, resolvedNavId, internalChannel)
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
	 * 支持守卫重定向，但重定向深度超过 {@link MAX_REDIRECT_DEPTH} 时将取消导航。
	 *
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param mode - 导航模式
	 * @param redirectDepth - 当前重定向深度
	 * @param animation - 导航动画（仅 App 端生效），覆盖 meta.animation
	 * @param events - 页面间通信事件监听器（仅 push 时生效，且 useUniEventChannel: false 时）
	 * @param paramsKey - params 在 ParamsManager 中的 key，用于将 __params_key 拼入实际导航 URL
	 * @param navId - 导航 ID，用于将 __nav_id 拼入实际导航 URL（useUniEventChannel: true 时）
	 * @param internalChannel - 内置通信通道实例（useUniEventChannel: true 时）
	 * @returns 导航结果（push 模式或 useUniEventChannel 模式包含 eventChannel）
	 * @throws {NavigationFailure} 导航被中止、取消或 API 调用失败时抛出
	 */
	private async executeNavigation(
		to: RouteLocation,
		from: RouteLocation,
		mode: 'push' | 'replace' | 'relaunch' | 'back',
		redirectDepth: number,
		animation?: NavigationAnimation,
		events?: EventListeners,
		paramsKey?: string,
		navId?: string,
		internalChannel?: UniEventChannel
	): Promise<NavigationResult> {
		if (redirectDepth > MAX_REDIRECT_DEPTH) {
			// 超过重定向上限时清理已注册的通道
			if (navId) destroyChannel(navId)
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_CANCELLED, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		const config = this.matcher.getRouteConfig(to.path)

		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, mode, redirectDepth, animation, events, paramsKey, navId, internalChannel)
		if (handled) return handled

		const beforeEnterResult = config ? await this.guardManager.runBeforeEnterGuards(to, from, config) : { type: 'next' as const }
		const handledEnter = this.handleGuardResult(beforeEnterResult, to, from, mode, redirectDepth, animation, events, paramsKey, navId, internalChannel)
		if (handledEnter) return handledEnter

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, mode, redirectDepth, animation, events, paramsKey, navId, internalChannel)
		if (handledResolve) return handledResolve

		// 提前更新 currentRoute，确保目标页 onLoad/onShow 时 route.value 已是完整目标路由（含 name/params）
		// syncRoute 的去重机制会跳过 onShow 中的重复同步，保留此处设置的完整路由信息
		this.routeState.setCurrentRoute(to)

		try {
			// 实际导航 URL 需要将 __params_key 和 __nav_id 拼回 query（to.query 已被 matcher 清理，不含内部 key）
			// 这样 back() 返回时 syncCurrentRoute 可从 URL 读取 key 重建 params 和通道
			const queryWithKeys: Record<string, string> = { ...to.query }
			if (paramsKey) queryWithKeys[PARAMS_KEY] = paramsKey
			if (navId) queryWithKeys['__nav_id'] = navId

			const navOptions = {
				path: to.path,
				meta: to.meta,
				query: queryWithKeys,
				animation,
				events
			}

			let eventChannel: EventChannel | undefined
			if (mode === 'push') {
				eventChannel = await navigateTo(navOptions)
			} else if (mode === 'replace') {
				await replaceTo(navOptions)
			} else {
				await relaunchTo(navOptions)
			}

			this.guardManager.runAfterGuards(to, from)

			// useUniEventChannel 模式下返回内置通道，替代原生 eventChannel
			return { ...to, eventChannel: internalChannel ?? eventChannel }
		} catch (error) {
			// 导航 API 失败，回退 currentRoute 到来源路由，并清理已注册的通道
			this.routeState.setCurrentRoute(from)
			if (navId) destroyChannel(navId)
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
	 *
	 * 重定向方式优先级：守卫通过 next(location, { mode }) 指定的 mode > 原始导航方式。
	 * 原始导航为 back 时无法重定向（目标不在页面栈中），回退为 relaunch。
	 *
	 * @param result - 守卫执行结果
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param mode - 导航模式
	 * @param redirectDepth - 当前重定向深度
	 * @param animation - 当前导航的动画参数
	 * @param events - 当前导航的事件监听器
	 * @param paramsKey - 当前导航的 params key
	 * @param navId - 当前导航的 navigationId
	 * @param internalChannel - 当前导航的内置通道
	 * @returns 中止或重定向时返回 Promise\<RouteLocation\>，放行时返回 null
	 */
	private handleGuardResult(
		result: GuardResult,
		to: RouteLocation,
		from: RouteLocation,
		mode: 'push' | 'replace' | 'relaunch' | 'back',
		redirectDepth: number,
		animation?: NavigationAnimation,
		events?: EventListeners,
		paramsKey?: string,
		navId?: string,
		internalChannel?: UniEventChannel
	): Promise<NavigationResult> | null {
		if (result.type === 'abort') {
			// 中止时清理已注册的通道
			if (navId) destroyChannel(navId)
			const failure = new NavigationFailure(to, from, result.code)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		if (result.redirect) {
			// 重定向时提取新位置的动画参数和事件监听器，未指定则沿用当前值
			const redirectAnimation = extractAnimation(result.redirect) ?? animation
			const redirectEvents = extractEvents(result.redirect) ?? events
			const redirectTarget = this.matcher.resolve(result.redirect)
			// 重定向方式：守卫指定优先，否则沿用原始导航方式
			// back 无法作为重定向方式（目标不在页面栈中），回退为 relaunch
			const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
			return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, redirectAnimation, redirectEvents, paramsKey, navId, internalChannel)
		}

		return null
	}

	/**
	 * 触发所有已注册的错误处理器
	 * @param error - 路由错误对象
	 * @param to - 目标路由
	 * @param from - 来源路由
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
 * const router = createRouter({
 *   routes: [
 *     { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
 *     { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
 *     { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
 *   ],
 *   strict: true
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
