<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { useRouter, type RouteLocationRaw, type NavigationFailure, type NavigationAnimation, type EventListeners, type EventChannel } from '@meng-xi/uni-router'

const props = withDefaults(
	defineProps<{
		/** 目标路由位置，支持路径字符串、路径对象或命名对象 */
		to: RouteLocationRaw
		/** 是否使用替换模式导航 */
		replace?: boolean
		/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
		relaunch?: boolean
		/** 导航动画（仅 App 端生效），覆盖 meta.animation */
		animation?: NavigationAnimation
		/** 页面间通信事件监听器（仅 push 时生效），对应 uni.navigateTo 的 events 参数 */
		events?: EventListeners
		/** 按下时的样式类，设置为 'none' 可禁用点击态 */
		hoverClass?: string
		/** 是否阻止祖先节点的点击态 */
		hoverStopPropagation?: boolean
		/** 按住后多久出现点击态，单位 ms */
		hoverStartTime?: number
		/** 手指松开后点击态保留时间，单位 ms */
		hoverStayTime?: number
	}>(),
	{
		hoverClass: 'navigator-hover',
		hoverStopPropagation: false,
		hoverStartTime: 50,
		hoverStayTime: 600
	}
)

const emit = defineEmits<{
	/** push 导航成功后触发，返回 eventChannel 用于页面间通信（仅 push 时可用） */
	navigated: [eventChannel: EventChannel | undefined]
	/** 导航失败时触发（如守卫中止、重复导航） */
	error: [error: NavigationFailure]
}>()

/** 导航器实例 */
const router = useRouter()

/** 导航到目标页面 */
async function navigate() {
	try {
		let location: RouteLocationRaw = props.to
		// 将 animation 和 events 合并到 location 对象中传递给路由器
		if (props.animation || props.events) {
			if (typeof props.to === 'string') {
				location = { path: props.to, animation: props.animation, events: props.events }
			} else {
				location = { ...props.to, animation: props.animation, events: props.events }
			}
		}

		if (props.relaunch) {
			await router.relaunch(location)
		} else if (props.replace) {
			await router.replace(location)
		} else {
			const result = await router.push(location)
			emit('navigated', result.eventChannel)
		}
	} catch (error) {
		emit('error', error as NavigationFailure)
	}
}
</script>
