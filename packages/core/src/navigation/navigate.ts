import type { NavigationAnimation, EventChannel } from '@/types/route'
import { warn } from '@/utils/general'
import { getPlatform } from '@/utils'
import { animatePageExit } from '@/plugins/animation/h5'
import type { UniNavigationOptions } from './type'
import { uniNavigateTo, uniSwitchTab, uniRedirectTo, uniNavigateBack, uniReLaunch, hasQueryParams } from './helpers'

/**
 * 导航到指定页面，自动根据 meta.isTab 选择 navigateTo 或 switchTab
 * @param options - 导航选项
 * @returns EventChannel 实例（仅 navigateTo 时可用），switchTab 时返回 undefined
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function navigateTo(options: UniNavigationOptions): Promise<EventChannel | undefined> {
	const { path, meta, query, animation, events } = options
	// 生效动画已由 router 层计算（meta.animation 需 AnimationPlugin，未注册时不注入），此处直接用动画参数
	if (meta.isTab) {
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (animation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		if (events) {
			warn('uni.switchTab does not support events. The events option will be ignored.')
		}
		return uniSwitchTab(path).then(() => undefined)
	}
	return uniNavigateTo(path, query, animation, events)
}

/**
 * 替换当前页面，自动根据 meta.isTab 选择 redirectTo 或 switchTab
 * @param options - 导航选项
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function replaceTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query, animation } = options
	if (meta.isTab) {
		warn('router.replace() to a tab page will close all non-tab pages instead of replacing the current page only')
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (animation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		return uniSwitchTab(path)
	}
	if (animation) {
		warn('uni.redirectTo does not support animation parameters. The animation option will be ignored.')
	}
	return uniRedirectTo(path, query)
}

/**
 * 返回上一页或多级页面
 * @param delta - 返回的页面数，默认为 1
 * @param animation - 导航动画（App 端由 animationType 原生处理，H5 端通过 CSS 过渡实现）
 */
export async function goBack(delta: number = 1, animation?: NavigationAnimation): Promise<void> {
	// H5 端先播放页面退出动画，再执行 uni.navigateBack（App 端由 animationType 原生处理）
	if (getPlatform().isH5 && animation) {
		await animatePageExit(animation)
	}
	return uniNavigateBack(delta, animation)
}

/**
 * 关闭所有页面并打开目标页面，自动根据 meta.isTab 选择 reLaunch 或 switchTab
 * @param options - 导航选项
 * @throws {UniApiError} uni API 调用失败时抛出
 */
export function relaunchTo(options: UniNavigationOptions): Promise<void> {
	const { path, meta, query, animation } = options
	if (meta.isTab) {
		if (hasQueryParams(query)) {
			warn('uni.switchTab does not support query parameters. They will be ignored.')
		}
		if (animation) {
			warn('uni.switchTab does not support animation parameters. The animation option will be ignored.')
		}
		return uniSwitchTab(path)
	}
	if (animation) {
		warn('uni.reLaunch does not support animation parameters. The animation option will be ignored.')
	}
	return uniReLaunch(path, query)
}
