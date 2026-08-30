import type { NavigationAnimation, EventChannel, EventListeners } from '@/types/route'
import type { UniApiCause } from '@/types/error'
import { buildFullPath } from '@/utils/path'
import { getPlatform } from '@/utils'
import { markRouterCall } from '@/plugins/interceptor/install'
import { animatePageEnter } from '@/plugins/animation/h5'
import { UniApiError } from '@/errors/uni-api-error'

/**
 * 将回调风格的 uni API 转换为 Promise
 * @param api - uni API 名称
 * @param executor - 包含 success/fail 回调的执行函数
 * @returns Promise，成功时 resolve，失败时 reject 并封装为 UniApiError
 */
export function promisifyUniApi(api: string, executor: (resolve: () => void, reject: (err: UniApiCause) => void) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		executor(resolve, (err: UniApiCause) => reject(new UniApiError(api, err)))
	})
}

/**
 * 调用 uni.navigateTo 进行页面跳转
 * @param path - 目标页面路径
 * @param query - 查询参数
 * @param animation - 导航动画（App 端由 animationType 原生处理，H5 端通过 CSS 过渡实现）
 * @param events - 页面间通信事件监听器
 * @returns EventChannel 实例，用于向目标页面发送事件
 */
export function uniNavigateTo(path: string, query?: Record<string, string>, animation?: NavigationAnimation, events?: EventListeners): Promise<EventChannel> {
	const url = buildFullPath(path, query ?? {})
	return new Promise((resolve, reject) => {
		markRouterCall()
		uni.navigateTo({
			url,
			events,
			...(animation?.type && { animationType: animation.type }),
			...(animation?.duration != null && { animationDuration: animation.duration }),
			success: res => {
				// H5 端导航 API 不处理 animationType，改为对进入页播放 CSS 过渡动画
				if (getPlatform().isH5 && animation) animatePageEnter(animation)
				resolve(res.eventChannel)
			},
			fail: (err: UniApiCause) => reject(new UniApiError('navigateTo', err))
		})
	})
}

/**
 * 调用 uni.switchTab 切换 TabBar 页面
 * @param path - TabBar 页面路径
 */
export function uniSwitchTab(path: string): Promise<void> {
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
export function uniRedirectTo(path: string, query?: Record<string, string>): Promise<void> {
	const url = buildFullPath(path, query ?? {})
	return promisifyUniApi('redirectTo', (resolve, reject) => {
		markRouterCall()
		uni.redirectTo({ url, success: resolve, fail: reject })
	})
}

/**
 * 调用 uni.navigateBack 返回上一页
 * @param delta - 返回的页面数
 * @param animation - 导航动画（App 端由 animationType 原生处理，H5 端通过 CSS 过渡实现）
 */
export function uniNavigateBack(delta: number = 1, animation?: NavigationAnimation): Promise<void> {
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
export function uniReLaunch(path: string, query?: Record<string, string>): Promise<void> {
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
export function hasQueryParams(query?: Record<string, string>): boolean {
	return !!query && Object.keys(query).length > 0
}
