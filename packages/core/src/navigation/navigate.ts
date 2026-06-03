import type { RouteMeta } from '@/types/route'
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
}

/**
 * uni API 调用失败时的错误封装
 */
class UniApiError extends Error {
	/** 调用失败的 API 名称 */
	readonly api: string
	/** 原始错误原因 */
	readonly cause: unknown

	/**
	 * @param api - 失败的 uni API 名称
	 * @param cause - 原始错误对象
	 */
	constructor(api: string, cause: unknown) {
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
function promisifyUniApi(api: string, executor: (resolve: () => void, reject: (err: unknown) => void) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		executor(resolve, (err: unknown) => reject(new UniApiError(api, err)))
	})
}

/**
 * 调用 uni.navigateTo 进行页面跳转
 * @param path - 目标页面路径
 * @param query - 查询参数
 */
function uniNavigateTo(path: string, query?: Record<string, string>): Promise<void> {
	const url = buildFullPath(path, query ?? {})
	return promisifyUniApi('navigateTo', (resolve, reject) => {
		markRouterCall()
		uni.navigateTo({ url, success: resolve, fail: reject })
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
 */
function uniNavigateBack(delta: number = 1): Promise<void> {
	return promisifyUniApi('navigateBack', (resolve, reject) => {
		markRouterCall()
		uni.navigateBack({ delta, success: resolve, fail: reject })
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
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function navigateTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query } = options
	if (meta.isTab) {
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		return uniSwitchTab(path)
	}
	return uniNavigateTo(path, query)
}

/**
 * 替换当前页面，自动根据 meta.isTab 选择 redirectTo 或 switchTab
 * @param options - 导航选项
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function replaceTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query } = options
	if (meta.isTab) {
		warn('router.replace() to a tab page will close all non-tab pages instead of replacing the current page only')
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		return uniSwitchTab(path)
	}
	return uniRedirectTo(path, query)
}

/**
 * 返回上一页或多级页面
 * @param delta - 返回的页面数，默认为 1
 * @returns 页面栈不足时直接 resolve 而不执行导航
 */
export function goBack(delta: number = 1): Promise<void> {
	const pages = getCurrentPages()
	if (pages.length <= delta) {
		warn('Cannot go back: no previous page in the navigation stack')
		return Promise.resolve()
	}
	return uniNavigateBack(delta)
}

/**
 * 检查错误是否为 uni API 调用失败
 * @param error - 待检查的值
 * @returns 是 UniApiError 时返回 true
 */
export function isUniApiError(error: unknown): boolean {
	return error instanceof UniApiError
}
