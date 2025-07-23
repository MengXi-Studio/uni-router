import type { AfterEachHook, RouterInterface, RouterMethod, RouterOptions, NavigationGuard, NavigationGuardNextCallback, RouteConfig, RouteLocationRaw } from '@/type'
import { RouterErrorType } from '@/constants'
import { RouterError } from './error'
import { parseLocation, buildUrl, getCurrentRoute as getCurrentRouteUtil } from '@/utils'

/** uni-app 路由实现类，实现了 RouterInterface 接口，提供了一系列路由操作方法和守卫机制 */
export class Router implements RouterInterface {
	/**
	 * 路由配置列表，存储路由相关的配置信息
	 * 目前该属性未被使用，使用 @ts-ignore 忽略 TypeScript 未使用变量的警告
	 */
	// @ts-ignore
	private routes: RouteConfig[]
	/**
	 * 全局前置守卫列表，存储在路由导航前需要执行的守卫函数
	 * 这些守卫函数会在每次导航前依次执行，可用于权限验证、路由拦截等操作
	 */
	private beforeEachHooks: NavigationGuard[]
	/**
	 * 全局后置钩子列表，存储在路由导航完成后需要执行的钩子函数
	 * 这些钩子函数会在每次导航成功后依次执行，可用于日志记录、页面统计等操作
	 */
	private afterEachHooks: AfterEachHook[]

	/**
	 * 构造函数，初始化 Router 实例
	 * @param options 路由配置选项，包含路由配置列表等信息，默认为空对象
	 */
	constructor(options: RouterOptions = {}) {
		this.routes = options.routes || []
		this.beforeEachHooks = []
		this.afterEachHooks = []
	}

	/**
	 * 以推入新页面的方式进行路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	push(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'navigateTo')
	}

	/**
	 * 以替换当前页面的方式进行路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	replace(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'redirectTo')
	}

	/**
	 * 以重新启动应用的方式进行路由导航
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	launch(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'reLaunch')
	}

	/**
	 * 切换到指定的 tab 页面
	 * @param location 目标路由位置信息，可以是字符串路径或包含路径和查询参数的对象
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	tab(location: RouteLocationRaw): Promise<void> {
		return this.navigate(location, 'switchTab')
	}

	/**
	 * 返回到指定层数的上一个页面
	 * @param delta 要返回的页面层数，默认值为 -1，表示返回上一个页面
	 */
	go(delta: number = -1): void {
		uni.navigateBack({
			delta: Math.abs(delta)
		})
	}

	/**
	 * 返回到上一个页面，等同于调用 go(-1)
	 */
	back(): void {
		this.go(-1)
	}

	/**
	 * 添加全局前置守卫到守卫列表中
	 * 这些守卫会在每次导航前依次执行
	 * @param guard 全局前置守卫函数
	 */
	beforeEach(guard: NavigationGuard): void {
		this.beforeEachHooks.push(guard)
	}

	/**
	 * 添加全局后置钩子到钩子列表中
	 * 这些钩子会在每次导航成功后依次执行
	 * @param hook 全局后置钩子函数
	 */
	afterEach(hook: AfterEachHook): void {
		this.afterEachHooks.push(hook)
	}

	/**
	 * 获取当前页面的路由信息
	 * 通过调用 uni-app 的 getCurrentPages 方法获取当前页面栈，
	 * 并使用工具函数 getCurrentRouteUtil 解析最后一个页面的路由信息
	 * @returns 当前页面的路由信息对象，如果获取失败则返回 null
	 */
	getCurrentRoute() {
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
		const { path, query } = parseLocation(location)
		const from = this.getCurrentRoute()
		const to = {
			path,
			query: query || {},
			fullPath: buildUrl(path, query)
		}

		// 执行全局前置守卫
		for (const hook of this.beforeEachHooks) {
			try {
				await this.runGuard(hook, to, from)
			} catch (err) {
				if (err instanceof RouterError && err.type === RouterErrorType.NAVIGATION_REDIRECT && err.location) {
					return this.push(err.location as RouteLocationRaw)
				}
				return Promise.reject(err)
			}
		}

		try {
			if (method === 'switchTab') {
				await this.callMxMethod('switchTab', buildUrl(path))
			} else {
				await this.callMxMethod(method, to.fullPath)
			}

			// 执行全局后置钩子
			for (const hook of this.afterEachHooks) {
				hook(to, from)
			}
		} catch (err) {
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
			const next: NavigationGuardNextCallback = valid => {
				if (valid === false) {
					reject(RouterError.navigationAborted())
				} else if (typeof valid === 'string' || (typeof valid === 'object' && valid !== null && !(valid instanceof Error))) {
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
	 * @param method 导航方法，如 'navigateTo'、'redirectTo' 等
	 * @param url 导航的目标 URL
	 * @returns 一个 Promise，导航成功时 resolve，失败时 reject
	 */
	private callMxMethod(method: RouterMethod, url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const uniNav = uni[method]
			if (typeof uniNav === 'function') {
				;(uniNav as (options: { url: string }) => Promise<void>)({ url })
					.then(resolve)
					.catch(err => reject(RouterError.navigationFailed(err instanceof Error ? err.message : String(err))))
			} else {
				reject(RouterError.invalidMethod(method))
			}
		})
	}
}
