<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, type RouteLocationRaw, type NavigationFailure, type NavigationResult, type NavigationAnimation, type EventListeners, type EventChannel, type ParamObject } from '@meng-xi/uni-router'

const props = withDefaults(
	defineProps<{
		/** 目标路由位置，支持路径字符串、路径对象或命名对象 */
		to: RouteLocationRaw
		/** 是否使用替换模式导航 */
		replace?: boolean
		/** 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面） */
		relaunch?: boolean
		/** 页面参数，支持复杂数据（仅 JSON 可序列化值） */
		params?: ParamObject
		/** 页面参数是否持久化到 storage（默认 false，仅内存存储） */
		persistent?: boolean
		/** 导航动画（仅 App 端生效），覆盖 meta.animation */
		animation?: NavigationAnimation
		/** 页面间通信事件监听器，对应 uni.navigateTo 的 events 参数；默认仅 push 生效，启用 useUniEventChannel 后所有导航方式均生效 */
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
	/** 导航成功后触发，返回 eventChannel 用于页面间通信；默认仅 push 时有值，启用 useUniEventChannel 后所有导航方式均可用 */
	navigated: [eventChannel: EventChannel | undefined]
	/** 导航失败时触发（如守卫中止、重复导航） */
	error: [error: NavigationFailure]
}>()

/** 导航器实例 */
const router = useRouter()

/**
 * 合并后的最终路由位置
 *
 * 将 props.to 与 animation / events / params / persistent 合并为路由器可接收的 RouteLocationRaw。
 * 使用 computed 缓存结果，避免每次点击重复构造，并保持声明式可读。
 */
const location = computed<RouteLocationRaw>(() => {
	// 无附加选项时直接使用 to，避免无谓的对象包装
	if (!props.animation && !props.events && !props.params && props.persistent === undefined) {
		return props.to
	}

	// 字符串 to：包装为路径对象形式
	// 注：props.to 经 typeof 收窄后为 string，而 RouteLocationPathRaw.path 要求 RoutePath 字面量联合类型，
	// string 无法直接赋值，此处断言为 RouteLocationRaw 表示运行时该字符串必为合法 path
	if (typeof props.to === 'string') {
		return {
			path: props.to,
			animation: props.animation,
			events: props.events,
			params: props.params,
			persistent: props.persistent
		} as RouteLocationRaw
	}

	// 对象 to：合并附加选项（仅当对应 prop 有值时才覆盖，避免 undefined 覆盖 to 中已有值）
	return {
		...props.to,
		animation: props.animation,
		events: props.events,
		...(props.params && { params: props.params }),
		...(props.persistent !== undefined && { persistent: props.persistent })
	}
})

/** 导航到目标页面 */
async function navigate() {
	try {
		let result: NavigationResult
		if (props.relaunch) {
			result = await router.relaunch(location.value)
		} else if (props.replace) {
			result = await router.replace(location.value)
		} else {
			result = await router.push(location.value)
		}
		emit('navigated', result.eventChannel)
	} catch (error) {
		emit('error', error as NavigationFailure)
	}
}
</script>
