import type { RouteConfig, RouteLocation, RouteLocationRaw, RouteMeta, NavigationAnimation, Router, RouterOnError, RouterOptions } from '@/types'
import type { App } from 'vue'
import { RouterErrorCode } from '@/types/error'
import { NavigationFailure, RouterError } from '@/errors'
import { createGuardManager, type GuardResult } from '@/guard'
import { navigateTo, replaceTo, relaunchTo, goBack, isUniApiError } from '@/navigation'
import { getPageStackLength, getCurrentPagePath, getCurrentPageQuery } from '@/navigation/context'
import { createRouteState } from '@/state'
import { createRouteMatcher } from '@/matcher'
import { installInterceptors, removeInterceptors } from '@/interceptor'
import { buildFullPath } from '@/utils'

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
	private matcher = createRouteMatcher([], true)
	private errorHandlers: RouterOnError[] = []
	private pendingNavigation: Promise<RouteLocation> | null = null
	private _interceptUniApi: boolean

	/**
	 * @param options - 路由器初始化选项
	 */
	constructor(options: RouterOptions) {
		this.guardManager = createGuardManager(options.guardTimeout)
		this.matcher = createRouteMatcher(options.routes, options.strict ?? true)
		this._interceptUniApi = options.interceptUniApi ?? false
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
	 * @param location - 目标路由位置
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被守卫中止、重复或 API 调用失败时抛出
	 */
	push(location: RouteLocationRaw): Promise<RouteLocation> {
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
	async back(delta: number = 1, animation?: NavigationAnimation): Promise<void> {
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
		const handled = this.handleGuardResult(beforeResult, to, from, 'back', 0)
		if (handled) return handled as unknown as Promise<void>

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, 'back', 0)
		if (handledResolve) return handledResolve as unknown as Promise<void>

		// 守卫通过，执行返回
		try {
			await goBack(delta, effectiveAnimation)
			this.syncCurrentRoute(from)
			this.guardManager.runAfterGuards(to, from)
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
	 * 当页面通过浏览器后退、物理返回键等非路由器方式切换时，
	 * 路由器的 currentRoute 可能与实际页面不同步。
	 * 调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。
	 *
	 * 建议在每个页面的 onShow 生命周期中调用此方法。
	 */
	syncRoute(): void {
		const from = this.routeState.getCurrentRoute()
		const currentPath = getCurrentPagePath()
		const currentQuery = getCurrentPageQuery()
		// 若当前页面与路由状态一致（路径和查询参数均相同），无需更新
		if (currentPath === from.path && this.isSameQuery(currentQuery, from.query)) return
		this.syncCurrentRoute(from)
	}

	/**
	 * 安装路由器到 Vue 应用实例
	 *
	 * 注册全局属性 `$router` 和 `$route`，并通过 provide/inject 机制
	 * 使组件可以通过 `useRouter()` / `useRoute()` 访问路由器。
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
	 * @param mode - 导航模式，push 或 replace
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航失败时抛出
	 */
	private async performNavigation(location: RouteLocationRaw, mode: 'push' | 'replace' | 'relaunch'): Promise<RouteLocation> {
		// 等待前一次导航完成（无论成功或失败），避免并发导航
		// 错误已通过 onError 机制通知，此处无需再处理
		if (this.pendingNavigation) {
			await this.pendingNavigation.catch(() => {})
		}

		const to = this.matcher.resolve(location)
		const from = this.routeState.getCurrentRoute()
		// 从原始路由位置中提取动画参数（resolve 会丢弃 animation 字段）
		const animation = this.extractAnimation(location)

		if (mode === 'push' && this.isSameRouteLocation(to, from)) {
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_DUPLICATED, `Avoided redundant navigation to current location: "${to.fullPath}"`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		const navigationPromise = this.executeNavigation(to, from, mode, 0, animation)
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
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被中止、取消或 API 调用失败时抛出
	 */
	private async executeNavigation(to: RouteLocation, from: RouteLocation, mode: 'push' | 'replace' | 'relaunch' | 'back', redirectDepth: number, animation?: NavigationAnimation): Promise<RouteLocation> {
		if (redirectDepth > MAX_REDIRECT_DEPTH) {
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_CANCELLED, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		const config = this.matcher.getRouteConfig(to.path)

		const beforeResult = await this.guardManager.runBeforeGuards(to, from)
		const handled = this.handleGuardResult(beforeResult, to, from, mode, redirectDepth, animation)
		if (handled) return handled

		const beforeEnterResult = config ? await this.guardManager.runBeforeEnterGuards(to, from, config) : { type: 'next' as const }
		const handledEnter = this.handleGuardResult(beforeEnterResult, to, from, mode, redirectDepth, animation)
		if (handledEnter) return handledEnter

		const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, mode, redirectDepth, animation)
		if (handledResolve) return handledResolve

		try {
			const navOptions = {
				path: to.path,
				meta: to.meta,
				query: to.query,
				animation
			}

			if (mode === 'push') {
				await navigateTo(navOptions)
			} else if (mode === 'replace') {
				await replaceTo(navOptions)
			} else {
				await relaunchTo(navOptions)
			}

			this.routeState.setCurrentRoute(to)
			this.guardManager.runAfterGuards(to, from)

			return to
		} catch (error) {
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
	 * @param result - 守卫执行结果
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @param mode - 导航模式
	 * @param redirectDepth - 当前重定向深度
	 * @param animation - 当前导航的动画参数
	 * @returns 中止或重定向时返回 Promise\<RouteLocation\>，放行时返回 null
	 */
	private handleGuardResult(
		result: GuardResult,
		to: RouteLocation,
		from: RouteLocation,
		mode: 'push' | 'replace' | 'relaunch' | 'back',
		redirectDepth: number,
		animation?: NavigationAnimation
	): Promise<RouteLocation> | null {
		if (result.type === 'abort') {
			const failure = new NavigationFailure(to, from, result.code)
			this.triggerErrorHandlers(failure, to, from)
			return Promise.reject(failure)
		}

		if (result.redirect) {
			// 重定向时提取新位置的动画参数，未指定则沿用当前动画
			const redirectAnimation = this.extractAnimation(result.redirect) ?? animation
			const redirectTarget = this.matcher.resolve(result.redirect)
			return this.executeNavigation(redirectTarget, from, mode, redirectDepth + 1, redirectAnimation)
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

	/**
	 * 判断两个路由位置是否相同
	 * @param a - 第一个路由位置
	 * @param b - 第二个路由位置
	 * @returns 路径和查询参数均相同时返回 true
	 */
	private isSameRouteLocation(a: RouteLocation, b: RouteLocation): boolean {
		if (a.path !== b.path) return false
		if (a.name !== b.name) return false
		return this.isSameQuery(a.query, b.query)
	}

	/**
	 * 判断两组查询参数是否相同
	 * @param a - 第一组查询参数
	 * @param b - 第二组查询参数
	 * @returns 键值对完全一致时返回 true
	 */
	private isSameQuery(a: Record<string, string>, b: Record<string, string>): boolean {
		const keysA = Object.keys(a)
		const keysB = Object.keys(b)
		if (keysA.length !== keysB.length) return false
		return keysA.every(key => a[key] === b[key])
	}

	/**
	 * 从原始路由位置中提取动画参数
	 *
	 * resolve() 会丢弃 animation 字段，因此需要在解析前提取。
	 * 字符串形式的路由位置不包含动画参数。
	 *
	 * @param location - 原始路由位置
	 * @returns 动画配置，不存在时返回 undefined
	 */
	private extractAnimation(location: RouteLocationRaw): NavigationAnimation | undefined {
		if (typeof location === 'string') return undefined
		if (typeof location === 'object' && 'animation' in location) return location.animation
		return undefined
	}

	/**
	 * 根据 uni-app 实际页面栈同步 currentRoute 状态
	 *
	 * 当通过 back() 或浏览器后退等非 push/replace 方式改变页面后，
	 * 需要从页面栈中读取当前页面信息来更新路由状态。
	 *
	 * 状态同步不是一次完整的导航（未经过前置守卫），因此不触发 afterEach 钩子，
	 * 仅通知 onRouteChange 监听器。
	 *
	 * @param from - 导航前的路由位置
	 */
	private syncCurrentRoute(_from: RouteLocation): void {
		const currentPath = getCurrentPagePath()
		const config = this.matcher.getRouteConfig(currentPath)
		const meta: RouteMeta = config?.meta ?? {}
		const query = getCurrentPageQuery()
		const fullPath = buildFullPath(currentPath, query)
		const to: RouteLocation = { path: currentPath, meta, query, fullPath, _synced: true }
		this.routeState.setCurrentRoute(to)
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
