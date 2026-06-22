import type { EventChannel, EventListeners, UniAnimationType } from './types/route'

declare global {
	/**
	 * uni-app 页面实例的类型声明
	 */
	interface UniPage {
		/** 页面路由路径（不含前导 `/`） */
		route: string
		/** 页面启动参数 */
		options?: Record<string, string | undefined>
		/** 页面实例信息（部分平台可用） */
		$page?: { fullPath: string }
	}

	/**
	 * uni.navigateTo 成功回调的返回值
	 */
	interface UniNavigateToSuccessResult {
		/** 页面间通信事件通道，用于向被打开页面发送事件 */
		eventChannel: EventChannel
	}

	/**
	 * uni 导航 API 的通用选项
	 */
	interface UniNavigateOptions {
		/** 目标页面 URL（可包含查询参数） */
		url: string
		/** 导航成功回调 */
		success?: (res?: any) => void
		/** 导航失败回调 */
		fail?: (err: unknown) => void
		/** 导航完成回调（无论成功或失败） */
		complete?: () => void
	}

	/**
	 * uni.navigateTo API 的选项
	 */
	interface UniNavigateToOptions {
		/** 目标页面 URL（可包含查询参数） */
		url: string
		/** 页面间通信事件监听器 */
		events?: EventListeners
		/** 导航动画类型（仅 App 端生效） */
		animationType?: UniAnimationType
		/** 导航动画持续时间（仅 App 端生效） */
		animationDuration?: number
		/** 导航成功回调 */
		success?: (res: UniNavigateToSuccessResult) => void
		/** 导航失败回调 */
		fail?: (err: unknown) => void
		/** 导航完成回调（无论成功或失败） */
		complete?: () => void
	}

	/**
	 * uni.navigateBack API 的选项
	 */
	interface UniNavigateBackOptions {
		/** 返回的页面数，默认为 1 */
		delta?: number
		/** 导航成功回调 */
		success?: () => void
		/** 导航失败回调 */
		fail?: (err: unknown) => void
		/** 导航完成回调（无论成功或失败） */
		complete?: () => void
	}

	/**
	 * 获取当前页面栈
	 * @returns 页面实例数组，数组中第一个元素为首页，最后一个元素为当前页面
	 */
	function getCurrentPages(): UniPage[]

	/**
	 * uni 拦截器回调对象
	 */
	interface UniInterceptorInvokeResult {
		/** 返回修改后的参数以继续调用，返回 false 以阻止调用 */
		(args: Record<string, any>): Record<string, any> | false | void
	}

	/**
	 * uni 拦截器回调集合
	 */
	interface UniInterceptorCallbacks {
		/** 拦截调用，在 API 调用前触发 */
		invoke?: UniInterceptorInvokeResult
		/** 拦截成功回调 */
		success?: (res: any) => void
		/** 拦截失败回调 */
		fail?: (err: any) => void
		/** 拦截完成回调 */
		complete?: (res: any) => void
	}

	const uni: {
		/** 保留当前页面，跳转到应用内的某个页面 */
		navigateTo(options: UniNavigateToOptions): void
		/** 关闭当前页面，跳转到应用内的某个页面 */
		redirectTo(options: UniNavigateOptions): void
		/** 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面 */
		switchTab(options: UniNavigateOptions): void
		/** 关闭所有页面，打开到应用内的某个页面 */
		reLaunch(options: UniNavigateOptions): void
		/** 关闭当前页面，返回上一页面或多级页面 */
		navigateBack(options: UniNavigateBackOptions): void
		/** 动态设置当前页面的标题 */
		setNavigationBarTitle(options: { title: string }): void
		/** 添加 API 拦截器 */
		addInterceptor(api: string, callbacks: UniInterceptorCallbacks): void
		/** 移除 API 拦截器 */
		removeInterceptor(api: string): void
		/** 同步存储数据 */
		setStorageSync(key: string, data: any): void
		/** 同步读取存储数据 */
		getStorageSync(key: string): any
		/** 同步删除存储数据 */
		removeStorageSync(key: string): void
		/** 同步获取存储信息 */
		getStorageInfoSync(): { keys: string[]; currentSize: number; limitSize: number }
	}
}

export {}
