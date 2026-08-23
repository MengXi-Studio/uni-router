<template>
	<!-- #ifdef H5 -->
	<a class="router-link" :href="href" @click.stop="handleClick">
		<slot />
	</a>
	<!-- #endif -->

	<!-- #ifndef H5 -->
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop="handleClick">
		<slot />
	</navigator>
	<!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLink, type NavigationFailure } from '@meng-xi/uni-router'
import type { RouterLinkProps, RouterLinkEmits } from './type'

const props = withDefaults(defineProps<RouterLinkProps>(), {
	hoverClass: 'navigator-hover',
	hoverStopPropagation: false,
	hoverStartTime: 50,
	hoverStayTime: 600
})

const emit = defineEmits<RouterLinkEmits>()

// useLink 提供响应式 href（H5 原生 <a> 的链接地址）与导航方法
const {
	// #ifdef H5
	href: resolvedHref,
	// #endif

	navigate
} = useLink(props)

// #ifdef H5
/**
 * H5 端 `<a>` 的 href
 *
 * uni-app H5 默认 hash 路由，href 需带 `#` 前缀，右键"在新标签页打开"才能正确路由到目标页；
 * history 路由模式下 location.hash 为空，直接使用完整路径。
 */
const href = computed(() => {
	const fullPath = resolvedHref.value
	if (window.location.hash) {
		return `#${fullPath}`
	}

	return fullPath
})
// #endif

/**
 * 点击处理：
 * - H5：修饰键（ctrl/cmd/shift/alt）或中键点击保留浏览器原生行为（新标签页打开、另存为等）；
 *   普通左键点击阻止默认跳转，交由路由器导航（守卫链生效）
 * - 非 H5（App/小程序）：事件对象无修饰键属性，直接走路由器导航
 */
async function handleClick(event?: unknown) {
	// #ifdef H5
	const e = event as MouseEvent
	if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) {
		return
	}
	e.preventDefault()
	// #endif
	try {
		const result = await navigate()
		emit('navigated', result.eventChannel)
	} catch (error) {
		emit('error', error as NavigationFailure)
	}
}

defineOptions({ name: 'RouterLink' })
</script>

<style lang="scss" scoped>
/* #ifdef H5 */
.router-link {
	display: block;
	color: inherit;
	text-decoration: none;
}
/* #endif */
</style>
