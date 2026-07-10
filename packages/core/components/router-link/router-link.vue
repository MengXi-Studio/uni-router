<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteLocationRaw, useRouter, type NavigationResult, type NavigationFailure } from '@meng-xi/uni-router'
import type { RouterLinkProps, RouterLinkEmits } from './type'

const props = withDefaults(defineProps<RouterLinkProps>(), {
	hoverClass: 'navigator-hover',
	hoverStopPropagation: false,
	hoverStartTime: 50,
	hoverStayTime: 600
})

const emit = defineEmits<RouterLinkEmits>()

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

defineOptions({ name: 'RouterLink' })
</script>
