<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { useRouter, type RouteLocationRaw, type NavigationFailure, type NavigationAnimation } from '@meng-xi/uni-router'

const props = withDefaults(
	defineProps<{
		/** 目标路由位置，支持路径字符串、路径对象或命名对象 */
		to: RouteLocationRaw
		/** 是否使用替换模式导航 */
		replace?: boolean
		/** 导航动画（仅 App 端生效），覆盖 meta.animation */
		animation?: NavigationAnimation
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
	/** 导航失败时触发（如守卫中止、重复导航） */
	error: [error: NavigationFailure]
}>()

/** 导航器实例 */
const router = useRouter()

/** 导航到目标页面 */
async function navigate() {
	try {
		let location: RouteLocationRaw = props.to
		// 将 animation 合并到 location 对象中传递给路由器
		if (props.animation) {
			if (typeof props.to === 'string') {
				location = { path: props.to, animation: props.animation }
			} else {
				location = { ...props.to, animation: props.animation }
			}
		}

		if (props.replace) {
			await router.replace(location)
		} else {
			await router.push(location)
		}
	} catch (error) {
		emit('error', error as NavigationFailure)
	}
}
</script>
