import type { NavigationAnimation } from '@/types'
import { DEFAULT_ANIMATION_DURATION } from '@/constants'
import { getPlatform } from '@/utils'

/**
 * H5 页面过渡动画的 CSS 关键帧
 *
 * 与 App 端 animationType 命名对齐（slide-in-right / fade-in / pop-in 等）。
 * 通过 transform / opacity 实现，配合 `both` 填充模式保证动画结束后停留在终点状态。
 */
const ANIMATION_CSS = `
@keyframes mxuni-slide-in-right { from { transform: translate3d(100%, 0, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-right { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(100%, 0, 0); } }
@keyframes mxuni-slide-in-left { from { transform: translate3d(-100%, 0, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-left { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-100%, 0, 0); } }
@keyframes mxuni-slide-in-top { from { transform: translate3d(0, -100%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-top { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -100%, 0); } }
@keyframes mxuni-slide-in-bottom { from { transform: translate3d(0, 100%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-bottom { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 100%, 0); } }
@keyframes mxuni-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes mxuni-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes mxuni-zoom-in { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes mxuni-zoom-out { from { transform: scale(1); } to { transform: scale(1.2); } }
@keyframes mxuni-zoom-fade-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes mxuni-zoom-fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.2); } }
@keyframes mxuni-pop-in { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes mxuni-pop-out { from { transform: scale(1); } to { transform: scale(1.2); } }
`

/**
 * H5 动画样式是否已注入
 */
let stylesInjected = false

/**
 * 注入 H5 页面过渡动画样式（幂等，仅 H5 平台生效）
 *
 * 通过运行时平台判断（getPlatform）而非条件编译——npm 发布产物由 tsup 构建，
 * 不会处理 `#ifdef H5` 条件编译注释，因此平台判断必须在运行时完成。
 */
export function ensureH5AnimationStyles(): void {
	if (stylesInjected || !getPlatform().isH5 || typeof document === 'undefined') return
	stylesInjected = true
	const style = document.createElement('style')
	style.setAttribute('data-mxuni-animation', '')
	style.textContent = ANIMATION_CSS
	;(document.head || document.documentElement).appendChild(style)
}

/**
 * 进入动画类型 → CSS 关键帧名映射（push / replace / relaunch）
 */
const ENTER_KEYFRAMES: Record<string, string> = {
	'slide-in-right': 'mxuni-slide-in-right',
	'slide-in-left': 'mxuni-slide-in-left',
	'slide-in-top': 'mxuni-slide-in-top',
	'slide-in-bottom': 'mxuni-slide-in-bottom',
	'fade-in': 'mxuni-fade-in',
	'zoom-in': 'mxuni-zoom-in',
	'zoom-fade-in': 'mxuni-zoom-fade-in',
	'pop-in': 'mxuni-pop-in'
}

/**
 * 退出动画类型 → CSS 关键帧名映射（back）
 */
const EXIT_KEYFRAMES: Record<string, string> = {
	'slide-out-right': 'mxuni-slide-out-right',
	'slide-out-left': 'mxuni-slide-out-left',
	'slide-out-top': 'mxuni-slide-out-top',
	'slide-out-bottom': 'mxuni-slide-out-bottom',
	'fade-out': 'mxuni-fade-out',
	'zoom-out': 'mxuni-zoom-out',
	'zoom-fade-out': 'mxuni-zoom-fade-out',
	'pop-out': 'mxuni-pop-out'
}

/**
 * 获取页面栈顶部的 uni-page 元素
 *
 * uni-app H5 将每个页面渲染为 `<uni-page>`，栈顶元素即为当前页面。
 */
function getTopPageElement(): HTMLElement | null {
	if (typeof document === 'undefined') return null
	const pages = document.querySelectorAll('uni-page')
	if (!pages.length) return null
	return pages[pages.length - 1] as HTMLElement
}

/**
 * 为目标页面播放进入动画（push / replace / relaunch，H5 端）
 *
 * 在 uni 导航 API 成功后调用。因目标页可能在 success 时尚未完成渲染，
 * 通过 requestAnimationFrame 延后到下一帧再应用动画。
 *
 * @param animation - 导航动画配置
 */
export function animatePageEnter(animation: NavigationAnimation): void {
	if (!getPlatform().isH5) return
	ensureH5AnimationStyles()
	const keyframe = ENTER_KEYFRAMES[animation.type]
	if (!keyframe) return

	requestAnimationFrame(() => {
		const el = getTopPageElement()
		if (!el) return
		const duration = animation.duration ?? DEFAULT_ANIMATION_DURATION
		el.style.animation = `${keyframe} ${duration}ms ease both`
		const clear = () => {
			el.style.animation = ''
		}
		el.addEventListener('animationend', clear, { once: true })
		// 兜底：动画被中断（如页面快速切换）时清理样式，避免残留
		setTimeout(clear, duration + 100)
	})
}

/**
 * 为当前页面播放退出动画并等待完成（back，H5 端）
 *
 * 在 uni.navigateBack 前调用：先播放退出动画，动画结束后再执行真正的返回，
 * 使页面滑出效果与 App 端原生动画一致。
 *
 * @param animation - 导航动画配置
 * @returns 动画播放完成后 resolve
 */
export async function animatePageExit(animation: NavigationAnimation): Promise<void> {
	if (!getPlatform().isH5) return
	ensureH5AnimationStyles()
	const keyframe = EXIT_KEYFRAMES[animation.type]
	if (!keyframe) return
	const el = getTopPageElement()
	if (!el) return

	const duration = animation.duration ?? DEFAULT_ANIMATION_DURATION
	el.style.animation = `${keyframe} ${duration}ms ease both`
	await new Promise<void>(resolve => {
		const clear = () => {
			el.style.animation = ''
			resolve()
		}
		const timer = setTimeout(clear, duration + 50)
		el.addEventListener(
			'animationend',
			() => {
				clearTimeout(timer)
				clear()
			},
			{ once: true }
		)
	})
}
