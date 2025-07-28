import type {
	AfterEachHook,
	RouterInterface,
	RouterMethod,
	RouterOptions,
	NavigationGuard,
	NavigationGuardNextCallback,
	RouteConfig,
	RouteLocationRaw,
	RouterOpenAnimation,
	RouterCloseAnimation
} from '@/types'
import { RouterErrorType } from '@/constants'
import { RouterError } from './error'
import { parseLocation, buildUrl, getCurrentRoute as getCurrentRouteUtil } from '@/utils'
import { isAnimationSupported } from '@/utils/router/isAnimationSupported'

/**
 * uni-app 路由实现类，实现了 RouterInterface 接口，提供了一系列路由操作方法和守卫机制
 * 支持单例模式调用和实例调用两种方式
 */
export class Router implements RouterInterface {
	/**
	 * 单例实例，用于单例模式调用
	 * @private
	 * @static
	 * @type {Router | undefined}
	 */
	private static instance: Router

	/**
	 * 路由配置列表，存储所有的路由配置信息
	 * @private
	 * @type {RouteConfig[]}
	 */
	private routes: RouteConfig[]

	/**
	 * 全局前置守卫列表，在每次导航前依次执行
	 * @private
	 * @type {NavigationGuard[]}
	 */
	private beforeEachHooks: NavigationGuard[]

	/**
	 * 全局后置钩子列表，在每次导航成功后依次执行
	 * @private
	 * @type {AfterEachHook[]}
	 */
	private afterEachHooks: AfterEachHook[]

	/**
	 * 存储用户自定义的 getCurrentRoute 函数
	 * @private
	 * @type {(() => ReturnType<typeof getCurrentRouteUtil>) | undefined}
	 */
	private customGetCurrentRoute: (() => ReturnType<typeof getCurrentRouteUtil>) | undefined

	/**
	 * 构造函数，初始化 Router 实例
	 * 私有构造函数，防止外部直接实例化，保证单例模式的实现
	 * @param {RouterOptions} [options={}] - 路由配置选项，包含路由配置列表等信息，默认为空对象
	 */
	constructor(options: RouterOptions = {}) {
		// 初始化路由配置列表，若未传入则为空数组
		this.routes = options.routes || []
		// 初始化全局前置守卫列表为空数组
		this.beforeEachHooks = []
		// 初始化全局后置钩子列表为空数组
		this.afterEachHooks = []
		// 初始化用户自定义的 getCurrentRoute 函数，若未传入则为 undefined
		this.customGetCurrentRoute = options.customGetCurrentRoute
	}

	/**
	 * 获取单例实例
	 * 首次获取实例时需要传入路由配置选项，后续获取使用之前的配置
	 * @static
	 * @param {RouterOptions} [options] - 路由配置选项
	 * @returns {Router} Router 实例
	 */
	static getInstance(options?: RouterOptions): Router {
		// 若单例实例不存在，则创建一个新实例
		if (!Router.instance) {
			Router.instance = new Router(options)
		}

		return Router.instance
	}

	/**
	 * 以推入新页面的方式进行路由导航 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @static
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @param {RouterOpenAnimation} [animation] - 窗口显示动画配置
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static push(location: RouteLocationRaw, animation?: RouterOpenAnimation): Promise<void> {
		return Router.getInstance().push(location, animation)
	}

	/**
	 * 以推入新页面的方式进行路由导航 - 实例方法
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @param {RouterOpenAnimation} [animation] - 窗口显示动画配置
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	push(location: RouteLocationRaw, animation?: RouterOpenAnimation): Promise<void> {
		return this.navigate(location, 'navigateTo', animation)
	}

	/**
	 * 以替换当前页面的方式进行路由导航 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @static
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static replace(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().replace(location)
	}

	/**
	 * 以替换当前页面的方式进行路由导航 - 实例方法
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	replace(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'redirectTo')
	}

	/**
	 * 以重新启动应用的方式进行路由导航 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @static
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static launch(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().launch(location)
	}

	/**
	 * 以重新启动应用的方式进行路由导航 - 实例方法
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	launch(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'reLaunch')
	}

	/**
	 * 切换到指定的 tab 页面 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @static
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static tab(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().tab(location)
	}

	/**
	 * 切换到指定的 tab 页面 - 实例方法
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	tab(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'switchTab')
	}

	/**
	 * 返回到指定层数的上一个页面 - 静态方法
	 * 通过单例实例调用实例方法实现页面返回
	 * @static
	 * @param {number} [delta=-1] - 要返回的页面层数，默认值为 -1，表示返回上一个页面
	 * @param {RouterCloseAnimation} [animation] - 窗口关闭动画配置
	 */
	static go(delta: number = -1, animation?: RouterCloseAnimation): void {
		Router.getInstance().go(delta, animation)
	}

	/**
	 * 返回到指定层数的上一个页面 - 实例方法
	 * 调用 uni-app 的 navigateBack 方法实现页面返回
	 * @param {number} [delta=-1] - 要返回的页面层数，默认值为 -1，表示返回上一个页面
	 * @param {RouterCloseAnimation} [animation] - 窗口关闭动画配置
	 */
	go(delta: number = -1, animation?: RouterCloseAnimation): void {
		const options: UniApp.NavigateBackOptions = {
			delta: Math.abs(delta),
			...(isAnimationSupported() &&
				animation && {
					animationType: animation.type || 'pop-out',
					animationDuration: animation.duration || 300
				})
		}

		uni.navigateBack(options)
	}

	/**
	 * 返回到上一个页面，等同于调用 go(-1) - 静态方法
	 * 通过单例实例调用实例方法实现页面返回
	 * @static
	 * @param {RouterCloseAnimation} [animation] - 窗口关闭动画配置
	 */
	static back(animation?: RouterCloseAnimation): void {
		Router.getInstance().back(animation)
	}

	/**
	 * 返回到上一个页面，等同于调用 go(-1) - 实例方法
	 * 调用 go 方法实现页面返回
	 * @param {RouterCloseAnimation} [animation] - 窗口关闭动画配置
	 */
	back(animation?: RouterCloseAnimation): void {
		this.go(-1, animation)
	}

	/**
	 * 添加全局前置守卫到守卫列表中 - 静态方法
	 * 通过单例实例调用实例方法添加全局前置守卫
	 * 这些守卫会在每次导航前依次执行
	 * @static
	 * @param {NavigationGuard} guard - 全局前置守卫函数
	 */
	static beforeEach(guard: NavigationGuard): void {
		Router.getInstance().beforeEach(guard)
	}

	/**
	 * 添加全局前置守卫到守卫列表中 - 实例方法
	 * 将全局前置守卫函数添加到前置守卫列表中
	 * 这些守卫会在每次导航前依次执行
	 * @param {NavigationGuard} guard - 全局前置守卫函数
	 */
	beforeEach(guard: NavigationGuard): void {
		this.beforeEachHooks.push(guard)
	}

	/**
	 * 添加全局后置钩子到钩子列表中 - 静态方法
	 * 通过单例实例调用实例方法添加全局后置钩子
	 * 这些钩子会在每次导航成功后依次执行
	 * @static
	 * @param {AfterEachHook} hook - 全局后置钩子函数
	 */
	static afterEach(hook: AfterEachHook): void {
		Router.getInstance().afterEach(hook)
	}

	/**
	 * 添加全局后置钩子到钩子列表中 - 实例方法
	 * 将全局后置钩子函数添加到后置钩子列表中
	 * 这些钩子会在每次导航成功后依次执行
	 * @param {AfterEachHook} hook - 全局后置钩子函数
	 */
	afterEach(hook: AfterEachHook): void {
		this.afterEachHooks.push(hook)
	}

	/**
	 * 设置自定义的 getCurrentRoute 函数
	 * @static
	 * @param {() => ReturnType<typeof getCurrentRouteUtil>} customFunction - 自定义的 getCurrentRoute 函数
	 */
	static setCustomGetCurrentRoute(customFunction: () => ReturnType<typeof getCurrentRouteUtil>): void {
		Router.getInstance().setCustomGetCurrentRoute(customFunction)
	}

	/**
	 * 设置自定义的 getCurrentRoute 函数
	 * @param {() => ReturnType<typeof getCurrentRouteUtil>} customFunction - 自定义的 getCurrentRoute 函数
	 */
	setCustomGetCurrentRoute(customFunction: () => ReturnType<typeof getCurrentRouteUtil>): void {
		this.customGetCurrentRoute = customFunction
	}

	/**
	 * 获取当前页面的路由信息 - 静态方法
	 * 通过单例实例调用实例方法获取当前页面的路由信息
	 * @static
	 * @returns {ReturnType<typeof getCurrentRouteUtil> | null} 当前页面的路由信息对象，如果获取失败则返回 null
	 */
	static getCurrentRoute(): ReturnType<typeof getCurrentRouteUtil> | null {
		return Router.getInstance().getCurrentRoute()
	}

	/**
	 * 获取当前页面的路由信息 - 实例方法
	 * 优先使用用户自定义的 getCurrentRoute 函数，若未定义则使用默认实现
	 * @returns {ReturnType<typeof getCurrentRouteUtil> | null} 当前页面的路由信息对象，如果获取失败则返回 null
	 */
	getCurrentRoute(): ReturnType<typeof getCurrentRouteUtil> | null {
		if (this.customGetCurrentRoute) {
			return this.customGetCurrentRoute()
		}

		const pages = getCurrentPages()
		return pages.length > 0 ? getCurrentRouteUtil(pages[pages.length - 1]) : null
	}

	/**
	 * 执行路由导航操作，包含前置守卫和后置钩子的处理
	 * @private
	 * @param {RouteLocationRaw} location - 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @param {RouterMethod} method - 导航方法，如 'navigateTo'、'redirectTo' 等
	 * @param {RouterOpenAnimation} [animation] - 窗口显示动画配置
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	private async navigate(location: RouteLocationRaw, method: RouterMethod, animation?: RouterOpenAnimation): Promise<void> {
		const { path, query } = parseLocation(location)
		const from = this.getCurrentRoute()
		const to = {
			path,
			query: query || {},
			fullPath: buildUrl(path, query)
		}

		try {
			for (const hook of this.beforeEachHooks) {
				await this.runGuard(hook, to, from)
			}

			if (method === 'switchTab') {
				await this.callMxMethod('switchTab', buildUrl(path))
			} else {
				await this.callMxMethod(method, to.fullPath, animation)
			}

			for (const hook of this.afterEachHooks) {
				hook(to, from)
			}
		} catch (err) {
			if (err instanceof RouterError && err.type === RouterErrorType.NAVIGATION_REDIRECT && err.location) {
				return this.push(err.location as RouteLocationRaw)
			}

			throw RouterError.navigationFailed(err instanceof Error ? err.message : String(err))
		}
	}

	/**
	 * 执行单个全局前置守卫函数
	 * @private
	 * @param {NavigationGuard} guard - 全局前置守卫函数
	 * @param {any} to - 目标路由信息对象
	 * @param {any} from - 当前路由信息对象
	 * @returns {Promise<void>} 一个 Promise，守卫验证通过时 resolve，验证失败时 reject
	 */
	private runGuard(guard: NavigationGuard, to: any, from: any): Promise<void> {
		return new Promise((resolve, reject) => {
			const next: NavigationGuardNextCallback = valid => {
				if (valid === false) {
					reject(RouterError.navigationAborted())
				} else if (typeof valid === 'string' || (typeof valid === 'object' && valid !== null)) {
					reject(RouterError.navigationRedirect(valid))
				} else {
					resolve()
				}
			}

			try {
				const guardResult = guard(to, from, next)
				if (guardResult !== undefined) {
					Promise.resolve(guardResult)
						.then(resolvedValue => {
							if (resolvedValue === false) {
								reject(RouterError.navigationAborted())
							} else if (typeof resolvedValue === 'string' || (typeof resolvedValue === 'object' && resolvedValue !== null)) {
								reject(RouterError.navigationRedirect(resolvedValue))
							} else {
								resolve()
							}
						})
						.catch(reject)
				}
			} catch (err) {
				reject(err)
			}
		})
	}

	/**
	 * 调用 uni-app 的路由方法进行导航
	 * @private
	 * @param {RouterMethod} method - 导航方法，如 'navigateTo'、'redirectTo' 等
	 * @param {string} url - 导航的目标 URL
	 * @param {RouterOpenAnimation} [animation] - 窗口显示动画配置
	 * @returns {Promise<void>} 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	private callMxMethod(method: RouterMethod, url: string, animation?: RouterOpenAnimation): Promise<void> {
		return new Promise((resolve, reject) => {
			const uniNav = uni[method]
			const options: UniApp.NavigateToOptions = { url }

			if (isAnimationSupported() && animation) {
				options.animationType = animation.type || 'pop-in'
				options.animationDuration = animation.duration || 300
			}

			if (typeof uniNav === 'function') {
				;(uniNav as (options: UniApp.NavigateToOptions) => Promise<void>)(options)
					.then(resolve)
					.catch(err => reject(RouterError.navigationFailed(err instanceof Error ? err.message : String(err))))
			} else {
				reject(RouterError.invalidMethod(method))
			}
		})
	}
}
