import type { RouteMeta, NavigationAnimation, EventChannel, EventListeners } from '@/types'
import type { UniApiCause, UniApiError as UniApiErrorType } from '@/types/error'
import { buildFullPath } from '@/utils/path'
import { warn } from '@/utils/general'
import { markRouterCall } from '@/interceptor'

/**
 * uni 导航 API 的统一选项
 */
export interface UniNavigationOptions {
	/** 目标页面路径 */
	path: string
	/** 路由元信息 */
	meta: RouteMeta
	/** 查询参数 */
	query?: Record<string, string>
	/** 导航动画（仅 App 端生效），覆盖 meta.animation */
	animation?: NavigationAnimation
	/**
	 * 页面间通信事件监听器（仅 push 时生效）
	 *
	 * 对应 uni.navigateTo 的 events 参数，用于监听目标页面通过 eventChannel.emit 发送的事件。
	 * 其他导航方式不支持 events，传入时将被忽略。
	 *
	 * 注：启用 `useUniEventChannel` 后，events 由内置 `ChannelManager` 接管，
	 * 调用方在传入 events 时由 router 内部创建 `UniEventChannel` 并注册监听，
	 * 此处 events 不会被传给原生 uni.navigateTo（传 undefined 以禁用原生 EventChannel）。
	 */
	events?: EventListeners
}

/**
 * uni API 调用失败时的错误封装
 */
class UniApiError extends Error {
	/** 调用失败的 API 名称 */
	readonly api: string
	/** 原始错误原因 */
	readonly cause: UniApiCause

	/**
	 * @param api - 失败的 uni API 名称
	 * @param cause - 原始错误对象
	 */
	constructor(api: string, cause: UniApiCause) {
		super(`[uni-router] uni.${api} failed`)
		this.name = 'UniApiError'
		this.api = api
		this.cause = cause
	}
}

/**
 * 将回调风格的 uni API 转换为 Promise
 * @param api - uni API 名称
 * @param executor - 包含 success/fail 回调的执行函数
 * @returns Promise，成功时 resolve，失败时 reject 并封装为 UniApiError
 */
function promisifyUniApi(api: string, executor: (resolve: () => void, reject: (err: UniApiCause) => void) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		executor(resolve, (err: UniApiCause) => reject(new UniApiError(api, err)))
	})
}

/**
 * 调用 uni.navigateTo 进行页面跳转
 * @param path - 目标页面路径
 * @param query - 查询参数
 * @param animation - 导航动画（仅 App 端生效）
 * @param events - 页面间通信事件监听器
 * @returns EventChannel 实例，用于向目标页面发送事件
 */
function uniNavigateTo(path: string, query?: Record<string, string>, animation?: NavigationAnimation, events?: EventListeners): Promise<EventChannel> {
	const url = buildFullPath(path, query ?? {})
	return new Promise((resolve, reject) => {
		markRouterCall()
		uni.navigateTo({
			url,
			events,
			...(animation?.type && { animationType: animation.type }),
			...(animation?.duration != null && { animationDuration: animation.duration }),
			success: res => resolve(res.eventChannel),
			fail: (err: UniApiCause) => reject(new UniApiError('navigateTo', err))
		})
	})
}

/**
 * 调用 uni.switchTab 切换 TabBar 页面
 * @param path - TabBar 页面路径
 */
function uniSwitchTab(path: string): Promise<void> {
	return promisifyUniApi('switchTab', (resolve, reject) => {
		markRouterCall()
		uni.switchTab({ url: path, success: resolve, fail: reject })
	})
}

/**
 * 调用 uni.redirectTo 替换当前页面
 * @param path - 目标页面路径
 * @param query - 查询参数
 */
function uniRedirectTo(path: string, query?: Record<string, string>): Promise<void> {
	const url = buildFullPath(path, query ?? {})
	return promisifyUniApi('redirectTo', (resolve, reject) => {
		markRouterCall()
		uni.redirectTo({ url, success: resolve, fail: reject })
	})
}

/**
 * 调用 uni.navigateBack 返回上一页
 * @param delta - 返回的页面数
 * @param animation - 导航动画（仅 App 端生效）
 */
function uniNavigateBack(delta: number = 1, animation?: NavigationAnimation): Promise<void> {
	return promisifyUniApi('navigateBack', (resolve, reject) => {
		markRouterCall()
		uni.navigateBack({
			delta,
			...(animation?.type && { animationType: animation.type }),
			...(animation?.duration != null && { animationDuration: animation.duration }),
			success: resolve,
			fail: reject
		})
	})
}

/**
 * 调用 uni.reLaunch 关闭所有页面并打开目标页面
 * @param path - 目标页面路径
 * @param query - 查询参数
 */
function uniReLaunch(path: string, query?: Record<string, string>): Promise<void> {
	const url = buildFullPath(path, query ?? {})
	return promisifyUniApi('reLaunch', (resolve, reject) => {
		markRouterCall()
		uni.reLaunch({ url, success: resolve, fail: reject })
	})
}

/**
 * 检查查询参数是否非空
 * @param query - 查询参数对象
 * @returns 存在参数时返回 true
 */
function hasQueryParams(query?: Record<string, string>): boolean {
	return !!query && Object.keys(query).length > 0
}

/**
 * 导航到指定页面，自动根据 meta.isTab 选择 navigateTo 或 switchTab
 * @param options - 导航选项
 * @returns EventChannel 实例（仅 navigateTo 时可用），switchTab 时返回 undefined
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function navigateTo(options: UniNavigationOptions): Promise<EventChannel | undefined> {
	const { path, meta, query, animation, events } = options
	const effectiveAnimation = animation ?? meta.animation
	if (meta.isTab) {
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (effectiveAnimation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		if (events) {
			warn('uni.switchTab does not support events. The events option will be ignored.')
		}
		return uniSwitchTab(path).then(() => undefined)
	}
	return uniNavigateTo(path, query, effectiveAnimation, events)
}

/**
 * 替换当前页面，自动根据 meta.isTab 选择 redirectTo 或 switchTab
 * @param options - 导航选项
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function replaceTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query, animation } = options
	const effectiveAnimation = animation ?? meta.animation
	if (meta.isTab) {
		warn('router.replace() to a tab page will close all non-tab pages instead of replacing the current page only')
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (effectiveAnimation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		return uniSwitchTab(path)
	}
	if (effectiveAnimation) {
		warn('uni.redirectTo does not support animation parameters. The animation option will be ignored.')
	}
	return uniRedirectTo(path, query)
}

/**
 * 返回上一页或多级页面
 * @param delta - 返回的页面数，默认为 1
 * @param animation - 导航动画（仅 App 端生效）
 */
export function goBack(delta: number = 1, animation?: NavigationAnimation): Promise<void> {
	return uniNavigateBack(delta, animation)
}

/**
 * 关闭所有页面并打开目标页面，自动根据 meta.isTab 选择 reLaunch 或 switchTab
 * @param options - 导航选项
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function relaunchTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query, animation } = options
	const effectiveAnimation = animation ?? meta.animation
	if (meta.isTab) {
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (effectiveAnimation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		return uniSwitchTab(path)
	}
	if (effectiveAnimation) {
		warn('uni.reLaunch does not support animation parameters. The animation option will be ignored.')
	}
	return uniReLaunch(path, query)
}

/**
 * 检查错误是否为 uni API 调用失败
 * @param error - 待检查的值
 * @returns 是 UniApiError 时返回 true
 */
export function isUniApiError(error: unknown): error is UniApiErrorType {
	return error instanceof UniApiError
}
