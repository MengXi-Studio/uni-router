/**
 * 导航动画类型
 *
 * 用于 uni.navigateTo / uni.navigateBack 的 animationType 参数，
 * 仅 App 端生效，其他平台自动忽略。
 *
 * 显示动画（navigateTo）：slide-in-right / slide-in-left / slide-in-top / slide-in-bottom / pop-in / fade-in / zoom-out / zoom-fade-out / none / auto
 * 关闭动画（navigateBack）：slide-out-right / slide-out-left / slide-out-top / slide-out-bottom / pop-out / fade-out / zoom-in / zoom-fade-in / none / auto
 *
 * @see https://en.uniapp.dcloud.io/api/router.html#animation
 */
export type UniAnimationType =
	| 'auto'
	| 'none'
	| 'slide-in-right'
	| 'slide-in-left'
	| 'slide-in-top'
	| 'slide-in-bottom'
	| 'slide-out-right'
	| 'slide-out-left'
	| 'slide-out-top'
	| 'slide-out-bottom'
	| 'fade-in'
	| 'fade-out'
	| 'zoom-out'
	| 'zoom-in'
	| 'zoom-fade-out'
	| 'zoom-fade-in'
	| 'pop-in'
	| 'pop-out'

/**
 * 动画持续时间默认值（ms），与 uni-app 官方默认值一致
 */
export const DEFAULT_ANIMATION_DURATION = 300

/**
 * 导航动画配置
 *
 * 仅 App 端生效，其他平台自动忽略。
 * 优先级：push/replace 调用时传入 > meta.animation > uni 默认值
 */
export interface NavigationAnimation {
	/** 窗口动画类型 */
	type: UniAnimationType
	/** 动画持续时间（ms），默认 300 */
	duration?: number
}
