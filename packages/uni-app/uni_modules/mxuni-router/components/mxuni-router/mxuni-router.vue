<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from '../../js_sdk'

const props = withDefaults(
	defineProps<{
		/** 目标路由位置，支持路径字符串、路径对象或命名对象 */
		to: RouteLocationRaw
		/** 是否使用替换模式导航 */
		replace?: boolean
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

/** 导航器实例 */
const router = useRouter()

/** 导航到目标页面 */
function navigate() {
	if (props.replace) {
		router.replace(props.to)
	} else {
		router.push(props.to)
	}
}
</script>
