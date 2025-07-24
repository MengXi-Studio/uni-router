import type { AfterEachHook, RouterInterface, RouterMethod, RouterOptions, NavigationGuard, NavigationGuardNextCallback, RouteConfig, RouteLocationRaw } from '@/type'
import { RouterErrorType } from '@/constants'
import { RouterError } from './error'
import { parseLocation, buildUrl, getCurrentRoute as getCurrentRouteUtil } from '@/utils'

/**
 * uni-app 路由实现类，实现了 RouterInterface 接口，提供了一系列路由操作方法和守卫机制
 * 支持单例模式调用和实例调用两种方式
 */
export class Router implements RouterInterface {
	// 单例实例，用于单例模式调用
	private static instance: Router
	// 路由配置列表，存储所有的路由配置信息
	private routes: RouteConfig[]
	// 全局前置守卫列表，在每次导航前依次执行
	private beforeEachHooks: NavigationGuard[]
	// 全局后置钩子列表，在每次导航成功后依次执行
	private afterEachHooks: AfterEachHook[]
	// 存储用户自定义的 getCurrentRoute 函数
	private customGetCurrentRoute: (() => ReturnType<typeof getCurrentRouteUtil>) | undefined

	/**
	 * 构造函数，初始化 Router 实例
	 * 私有构造函数，防止外部直接实例化，保证单例模式的实现
	 * @param options 路由配置选项，包含路由配置列表等信息，默认为空对象
	 */
	private constructor(options: RouterOptions = {}) {
		// 初始化路由配置列表，若未传入则为空数组
		this.routes = options.routes || []
		// 初始化全局前置守卫列表为空数组
		this.beforeEachHooks = []
		// 初始化全局后置钩子列表为空数组
		this.afterEachHooks = []
		// 初始化用户自定义的 getCurrentRoute 函数，若未传入则为 undefined
		this.customGetCurrentRoute = options.customGetCurrentRoute || void 0
	}

	/**
	 * 获取单例实例
	 * 首次获取实例时需要传入路由配置选项，后续获取使用之前的配置
	 * @param options 路由配置选项
	 * @returns Router 实例
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
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static push(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().push(location)
	}

	/**
	 * 以推入新页面的方式进行路由导航 - 实例方法
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	push(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'navigateTo')
	}

	/**
	 * 以替换当前页面的方式进行路由导航 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static replace(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().replace(location)
	}

	/**
	 * 以替换当前页面的方式进行路由导航 - 实例方法
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	replace(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'redirectTo')
	}

	/**
	 * 以重新启动应用的方式进行路由导航 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static launch(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().launch(location)
	}

	/**
	 * 以重新启动应用的方式进行路由导航 - 实例方法
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	launch(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'reLaunch')
	}

	/**
	 * 切换到指定的 tab 页面 - 静态方法
	 * 通过单例实例调用实例方法实现路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	static tab(location: RouteLocationRaw): Promise<void> {
		return Router.getInstance().tab(location)
	}

	/**
	 * 切换到指定的 tab 页面 - 实例方法
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	tab(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'switchTab')
	}

	/**
	 * 返回到指定层数的上一个页面 - 静态方法
	 * 通过单例实例调用实例方法实现页面返回
	 * @param delta 要返回的页面层数，默认值为 -1，表示返回上一个页面
	 */
	static go(delta: number = -1): void {
		Router.getInstance().go(delta)
	}

	/**
	 * 返回到指定层数的上一个页面 - 实例方法
	 * 调用 uni-app 的 navigateBack 方法实现页面返回
	 * @param delta 要返回的页面层数，默认值为 -1，表示返回上一个页面
	 */
	go(delta: number = -1): void {
		uni.navigateBack({
			delta: Math.abs(delta)
		})
	}

	/**
	 * 返回到上一个页面，等同于调用 go(-1) - 静态方法
	 * 通过单例实例调用实例方法实现页面返回
	 */
	static back(): void {
		Router.getInstance().back()
	}

	/**
	 * 返回到上一个页面，等同于调用 go(-1) - 实例方法
	 * 调用 go 方法实现页面返回
	 */
	back(): void {
		this.go(-1)
	}

	/**
	 * 添加全局前置守卫到守卫列表中 - 静态方法
	 * 通过单例实例调用实例方法添加全局前置守卫
	 * 这些守卫会在每次导航前依次执行
	 * @param guard 全局前置守卫函数
	 */
	static beforeEach(guard: NavigationGuard): void {
		Router.getInstance().beforeEach(guard)
	}

	/**
	 * 添加全局前置守卫到守卫列表中 - 实例方法
	 * 将全局前置守卫函数添加到前置守卫列表中
	 * 这些守卫会在每次导航前依次执行
	 * @param guard 全局前置守卫函数
	 */
	beforeEach(guard: NavigationGuard): void {
		this.beforeEachHooks.push(guard)
	}

	/**
	 * 添加全局后置钩子到钩子列表中 - 静态方法
	 * 通过单例实例调用实例方法添加全局后置钩子
	 * 这些钩子会在每次导航成功后依次执行
	 * @param hook 全局后置钩子函数
	 */
	static afterEach(hook: AfterEachHook): void {
		Router.getInstance().afterEach(hook)
	}

	/**
	 * 添加全局后置钩子到钩子列表中 - 实例方法
	 * 将全局后置钩子函数添加到后置钩子列表中
	 * 这些钩子会在每次导航成功后依次执行
	 * @param hook 全局后置钩子函数
	 */
	afterEach(hook: AfterEachHook): void {
		this.afterEachHooks.push(hook)
	}

	/**
	 * 设置自定义的 getCurrentRoute 函数
	 * @param customFunction 自定义的 getCurrentRoute 函数
	 */
	static setCustomGetCurrentRoute(customFunction: () => ReturnType<typeof getCurrentRouteUtil>) {
		return Router.getInstance().setCustomGetCurrentRoute(customFunction)
	}

	/**
	 * 设置自定义的 getCurrentRoute 函数
	 * @param customFunction 自定义的 getCurrentRoute 函数
	 */
	setCustomGetCurrentRoute(customFunction: () => ReturnType<typeof getCurrentRouteUtil>) {
		this.customGetCurrentRoute = customFunction
	}

	/**
	 * 获取当前页面的路由信息 - 静态方法
	 * 通过单例实例调用实例方法获取当前页面的路由信息
	 * @returns 当前页面的路由信息对象，如果获取失败则返回 null
	 */
	static getCurrentRoute() {
		return Router.getInstance().getCurrentRoute()
	}

	/**
	 * 获取当前页面的路由信息 - 实例方法
	 * 优先使用用户自定义的 getCurrentRoute 函数，若未定义则使用默认实现
	 * @returns 当前页面的路由信息对象，如果获取失败则返回 null
	 */
	getCurrentRoute() {
		if (this.customGetCurrentRoute) {
			return this.customGetCurrentRoute()
		}
		const pages = getCurrentPages()
		return getCurrentRouteUtil(pages[pages.length - 1])
	}

	/**
	 * 执行路由导航操作，包含前置守卫和后置钩子的处理
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @param method 导航方法，如 'navigateTo'、'redirectTo' 等
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	private async navigate(location: RouteLocationRaw, method: RouterMethod): Promise<void> {
		// 解析目标路由位置信息，获取路径和查询参数
		const { path, query } = parseLocation(location)
		// 获取当前页面的路由信息
		const from = this.getCurrentRoute()
		// 构建目标路由信息对象
		const to = {
			path,
			query: query || {},
			fullPath: buildUrl(path, query)
		}

		// 执行全局前置守卫
		for (const hook of this.beforeEachHooks) {
			try {
				// 执行单个全局前置守卫函数
				await this.runGuard(hook, to, from)
			} catch (err) {
				// 若守卫返回重定向错误，则重新发起导航
				if (err instanceof RouterError && err.type === RouterErrorType.NAVIGATION_REDIRECT && err.location) {
					return this.push(err.location as RouteLocationRaw)
				}
				// 否则，导航失败，拒绝 Promise
				return Promise.reject(err)
			}
		}

		try {
			// 针对 switchTab 方法特殊处理，仅传递路径
			if (method === 'switchTab') {
				await this.callMxMethod('switchTab', buildUrl(path))
			} else {
				// 调用 uni-app 的路由方法进行导航
				await this.callMxMethod(method, to.fullPath)
			}

			// 执行全局后置钩子
			for (const hook of this.afterEachHooks) {
				hook(to, from)
			}
		} catch (err) {
			// 导航失败，返回导航失败错误
			return Promise.reject(RouterError.navigationFailed(err instanceof Error ? err.message : String(err)))
		}
	}

	/**
	 * 执行单个全局前置守卫函数
	 * @param guard 全局前置守卫函数
	 * @param to 目标路由信息对象
	 * @param from 当前路由信息对象
	 * @returns 一个 Promise，守卫验证通过时 resolve，验证失败时 reject
	 */
	private runGuard(guard: NavigationGuard, to: any, from: any): Promise<void> {
		return new Promise((resolve, reject) => {
			// 定义 next 回调函数，用于处理守卫结果
			const next: NavigationGuardNextCallback = valid => {
				if (valid === false) {
					// 若守卫返回 false，则导航中止
					reject(RouterError.navigationAborted())
				} else if (typeof valid === 'string' || (typeof valid === 'object' && valid !== null && !(valid instanceof Error))) {
					// 若守卫返回重定向信息，则导航重定向
					reject(RouterError.navigationRedirect(valid))
				} else {
					// 守卫验证通过，继续导航
					resolve()
				}
			}

			try {
				// 执行守卫函数
				const guardResult = guard(to, from, next)
				if (guardResult !== undefined) {
					// 若守卫函数返回 Promise，则等待 Promise 结果
					Promise.resolve(guardResult)
						.then(resolvedValue => {
							if (resolvedValue === false) {
								// 若 Promise 结果为 false，则导航中止
								reject(RouterError.navigationAborted())
							} else if (typeof resolvedValue === 'string' || (typeof resolvedValue === 'object' && resolvedValue !== null)) {
								// 若 Promise 结果为重定向信息，则导航重定向
								reject(RouterError.navigationRedirect(resolvedValue))
							} else {
								// 守卫验证通过，继续导航
								resolve()
							}
						})
						.catch(reject)
				}
			} catch (err) {
				// 执行守卫函数出错，拒绝 Promise
				reject(err)
			}
		})
	}

	/**
	 * 调用 uni-app 的路由方法进行导航
	 * @param method 导航方法，如 'navigateTo'、'redirectTo' 等
	 * @param url 导航的目标 URL
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	private callMxMethod(method: RouterMethod, url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// 获取 uni-app 对应的路由方法
			const uniNav = uni[method]
			if (typeof uniNav === 'function') {
				// 调用 uni-app 的路由方法进行导航
				;(uniNav as (options: { url: string }) => Promise<void>)({ url })
					.then(resolve)
					.catch(err => reject(RouterError.navigationFailed(err instanceof Error ? err.message : String(err))))
			} else {
				// 若方法无效，返回无效方法错误
				reject(RouterError.invalidMethod(method))
			}
		})
	}
}
