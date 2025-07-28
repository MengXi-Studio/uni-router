/** 路由配置项接口 */
export interface RouteConfig {
	/** 路由路径 */
	path: string
	/** 路由元信息，可存储任意自定义数据 */
	meta?: Record<string, unknown>
	/** 子路由配置数组 */
	children?: RouteConfig[]
}

/** 路由位置描述对象 */
export interface RouteLocation {
	/** 目标路径 */
	path: string
	/** 查询参数对象 */
	query?: Record<string, string | number | boolean>
}

/** 路由位置描述，可以是字符串路径或RouteLocation对象 */
export type RouteLocationRaw = string | RouteLocation

/** 窗口显示动画配置 */
export interface RouterOpenAnimation {
	/** 动画类型 */
	type?: UniApp.NavigateToOptions['animationType']
	/** 动画持续时间 */
	duration?: number
}

/** 窗口关闭动画配置 */
export interface RouterCloseAnimation {
	/** 动画类型 */
	type?: UniApp.NavigateBackOptions['animationType']
	/** 动画持续时间 */
	duration?: number
}

/** uni-app路由跳转方法类型 */
export type RouterMethod = 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab' | 'navigateBack'

/** 当前路由信息 */
export interface Route {
	/** 路由路径 */
	path: string
	/** 完整路径（包含查询参数） */
	fullPath: string
	/** 解析后的查询参数对象 */
	query: Record<string, string>
}

/** 当前页面实例 */
export interface CurrentPage {
	/**
	 * 页面的参数选项，通常包含从上个页面传递过来的查询参数。
	 * 在小程序平台（如微信小程序、支付宝小程序等）中，该属性可直接获取页面参数。
	 * 该属性为可选属性，可能不存在。
	 */
	options?: Record<string, string>
	/**
	 * 页面的 Vue 实例，在 H5 和 App 平台可能会用到。
	 * 该属性为可选属性，可能不存在。
	 */
	$vm?: {
		/**
		 * 在 H5 平台中，Vue 实例的路由信息对象。
		 * 包含页面的查询参数等路由相关信息。
		 * 该属性为可选属性，可能不存在。
		 */
		$route?: {
			/**
			 * H5 平台中，页面的查询参数对象。
			 * 该属性为可选属性，可能不存在。
			 */
			query?: Record<string, string>
		}
		/**
		 * 在 App 平台中，Vue 实例的小程序相关信息对象。
		 * 包含页面的查询参数等信息。
		 * 该属性为可选属性，可能不存在。
		 */
		$mp?: {
			/**
			 * App 平台中，页面的查询参数对象。
			 * 该属性为可选属性，可能不存在。
			 */
			query?: Record<string, string>
		}
	}
	/**
	 * 当前页面的路由路径。
	 * 该属性为可选属性，可能不存在。
	 */
	route?: string
}

/**
 * 路由导航守卫函数的回调参数
 * @param valid 导航是否有效，为false时取消导航，为字符串时重定向到指定路径，为RouteLocationRaw对象时进行路由跳转
 */
export type NavigationGuardNextCallback = (valid?: boolean | string | RouteLocationRaw | void) => void

/**
 * 路由导航守卫函数
 * @param to 即将进入的路由
 * @param from 当前导航正要离开的路由
 * @param next 调用该方法来 resolve 这个钩子
 * @returns 可返回Promise或直接返回boolean/void
 */
export type NavigationGuard = (to: Route, from: Route | null, next: NavigationGuardNextCallback) => Promise<boolean | void> | boolean | void

/**
 * 路由后置钩子函数
 * @param to 已经进入的路由
 * @param from 上一个路由
 */
export type AfterEachHook = (to: Route, from: Route | null) => void

/** 路由构造器选项 */
export interface RouterOptions {
	/** 路由配置数组 */
	routes?: RouteConfig[]
	/**
	 * 自定义获取当前路由的函数
	 * @returns 当前路由信息对象，如果获取失败则返回 null
	 */
	customGetCurrentRoute?: () => Route | null
}

/** uni-app路由类接口 */
export interface RouterInterface {
	/** 跳转到指定页面（保留当前页面） */
	push(location: RouteLocationRaw): Promise<void>

	/** 跳转到指定页面（关闭当前页面） */
	replace(location: RouteLocationRaw): Promise<void>

	/** 跳转到指定页面（关闭所有页面） */
	launch(location: RouteLocationRaw): Promise<void>

	/** 跳转到tabBar页面 */
	tab(location: RouteLocationRaw): Promise<void>

	/** 返回指定页面数 */
	go(delta?: number): void

	/** 返回上一页 */
	back(): void

	/** 添加全局前置守卫 */
	beforeEach(guard: NavigationGuard): void

	/** 添加全局后置钩子 */
	afterEach(hook: AfterEachHook): void

	/** 获取当前路由信息 */
	getCurrentRoute(): Route | null
}
