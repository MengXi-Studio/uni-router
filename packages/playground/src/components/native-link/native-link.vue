<template>
	<!-- #ifdef H5 -->
	<a class="native-link" :href="href" :class="linkClass" @click="handleClick">
		<slot />
	</a>
	<!-- #endif -->
	<!-- #ifndef H5 -->
	<view class="native-link" :hover-class="hoverClass" :class="linkClass" @click.stop="handleClick">
		<slot />
	</view>
	<!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLink } from '@meng-xi/uni-router'
import type { NativeLinkProps, NativeLinkEmits } from './type'

const props = withDefaults(defineProps<NativeLinkProps>(), {
	replace: false,
	relaunch: false,
	hoverClass: 'native-link-hover'
})

const emit = defineEmits<NativeLinkEmits>()

// useLink 提供响应式的 href / isActive / isExactActive / navigate
const { href, isActive, isExactActive, navigate } = useLink({
	to: props.to,
	replace: props.replace,
	relaunch: props.relaunch
})

const linkClass = computed(() => ({
	'is-active': isActive.value,
	'is-exact-active': isExactActive.value
}))

/**
 * 点击处理：
 * - 修饰键（ctrl/cmd/shift/alt）或中键点击 → 保留浏览器原生行为（新标签页打开、另存为等）
 * - 普通左键点击 → 阻止默认跳转，交由路由器导航（守卫链生效）
 * 非 H5 平台（App/小程序）事件对象无修饰键属性，直接走路由器导航。
 */
async function handleClick(event?: unknown) {
	const e = event as MouseEvent | undefined
	if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)) {
		return
	}
	e?.preventDefault?.()
	try {
		const result = await navigate()
		emit('navigated', result.eventChannel)
	} catch (error) {
		emit('error', error)
	}
}
</script>

<style lang="scss">
.native-link {
	display: block;
	color: #007aff;
	text-decoration: none;
	transition: opacity 0.2s;

	// H5 使用原生 CSS :hover（<a> 原生能力），非 H5 由 hover-class 提供点击态
	&:hover {
		opacity: 0.7;
	}

	&.is-active {
		color: #34c759;
		font-weight: 600;
	}
}
</style>
