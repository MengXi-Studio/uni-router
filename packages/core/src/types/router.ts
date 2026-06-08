import type { RouteConfig, RouteLocation, RouteLocationRaw } from './route'
import type { NavigationGuard, PostNavigationGuard } from './guard'
import type { RouterError } from './error'
import type { App } from 'vue'

/**
 * 路由错误处理回调
 * @param error - 错误对象
 * @param to - 目标路由
 * @param from - 来源路由
 */
export type RouterOnError = (error: RouterError, to: RouteLocation, from: RouteLocation) => void

/**
 * 路由器初始化选项
 */
export interface RouterOptions {
	/** 路由配置列表，需与 pages.json 中的页面声明保持一致 */
	routes: RouteConfig[]

	/** 是否启用严格模式，启用后未匹配的命名路由将抛出异常 */
	strict?: boolean

	/**
	 * 是否拦截 uni 原生导航 API（navigateTo / redirectTo / switchTab / navigateBack）
	 *
	 * 启用后，直接调用 uni.navigateTo 等方法将被拦截并转由路由器处理，
	 * 确保路由守卫（beforeEach / beforeResolve / afterEach）始终生效。
	 *
	 * @default false
	 */
	interceptUniApi?: boolean

	/**
	 * 守卫超时时间（毫秒）
	 *
	 * 当守卫函数在此时间内既未调用 next() 也未返回 rejected Promise 时，
	 * 将输出警告并自动中止导航以防止永久挂起。
	 * 适用于守卫中包含耗时异步操作（如网络请求）的场景。
	 *
	 * 设为 0 可禁用超时保护（不推荐）。
	 *
	 * @default 10000
	 */
	guardTimeout?: number
}

/**
 * 路由器实例接口，提供路由导航、守卫注册和状态查询能力
 */
export interface Router {
	/** 当前路由位置（只读） */
	readonly currentRoute: RouteLocation

	/**
	 * 导航到新页面，对应 uni.navigateTo / uni.switchTab
	 * @param location - 目标路由位置
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被中止、重复或 API 调用失败时抛出
	 */
	push(location: RouteLocationRaw): Promise<RouteLocation>

	/**
	 * 替换当前页面，对应 uni.redirectTo / uni.switchTab
	 * @param location - 目标路由位置
	 * @returns 解析后的目标路由位置
	 * @throws {NavigationFailure} 导航被中止、重复或 API 调用失败时抛出
	 */
	replace(location: RouteLocationRaw): Promise<RouteLocation>

	/**
	 * 返回上一页或多级页面，对应 uni.navigateBack
	 *
	 * 执行完整的导航守卫链（beforeEach → beforeResolve），守卫可中止或重定向返回操作。
	 * 注意：物理返回键和浏览器后退不经过路由器，无法被守卫拦截。
	 *
	 * @param delta - 返回的页面数，默认为 1
	 * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
	 */
	back(delta?: number): Promise<void>

	/**
	 * 注册全局前置守卫，在每次导航前执行
	 * @param guard - 前置守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeEach(guard: NavigationGuard): () => void

	/**
	 * 注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行
	 * @param guard - 解析守卫函数
	 * @returns 用于移除此守卫的函数
	 */
	beforeResolve(guard: NavigationGuard): () => void

	/**
	 * 注册全局后置钩子，在导航完成后执行
	 * @param guard - 后置钩子函数
	 * @returns 用于移除此钩子的函数
	 */
	afterEach(guard: PostNavigationGuard): () => void

	/**
	 * 获取所有已注册的路由配置列表
	 * @returns 路由配置数组的浅拷贝
	 */
	getRoutes(): RouteConfig[]

	/**
	 * 检查是否存在指定名称的路由
	 * @param name - 路由名称
	 * @returns 存在时返回 true
	 */
	hasRoute(name: string): boolean

	/**
	 * 解析路由位置为完整的 RouteLocation 对象，不执行导航
	 * @param location - 原始路由位置
	 * @returns 解析后的路由位置
	 * @throws {RouterError} 严格模式下未找到路由时抛出
	 */
	resolve(location: RouteLocationRaw): RouteLocation

	/**
	 * 等待路由器初始化完成
	 * @returns 路由器就绪后 resolve 的 Promise
	 */
	isReady(): Promise<void>

	/**
	 * 注册路由变化监听器
	 *
	 * 当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。
	 * 与 afterEach 不同，此方法用于订阅路由状态变化，不参与导航流程控制。
	 *
	 * @param listener - 路由变化回调函数
	 * @returns 用于移除此监听器的函数
	 */
	onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void

	/**
	 * 注册路由错误处理回调
	 * @param handler - 错误处理函数
	 * @returns 用于移除此处理器的函数
	 */
	onError(handler: RouterOnError): () => void

	/**
	 * 同步路由状态与实际页面栈
	 *
	 * 当页面通过浏览器后退、物理返回键等非路由器方式切换时，
	 * 路由器的 currentRoute 可能与实际页面不同步。
	 * 调用此方法将从 uni-app 页面栈中读取当前页面信息并更新路由状态。
	 *
	 * 建议在每个页面的 onShow 生命周期中调用此方法。
	 */
	syncRoute(): void

	/**
	 * 安装路由器到 Vue 应用实例，注册全局属性和 provide
	 * @param app - Vue 应用实例
	 */
	install(app: App): void
}
