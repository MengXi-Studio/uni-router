import { ANIMATION_SUPPORTED_PLATFORMS } from '@/constants'

/**
 * 获取当前平台是否支持动画
 * @returns 是否支持动画
 */
export function isAnimationSupported(): boolean {
	const key = String(process.env.UNI_PLATFORM).toString().toLowerCase()
	return ANIMATION_SUPPORTED_PLATFORMS.includes(key)
}
