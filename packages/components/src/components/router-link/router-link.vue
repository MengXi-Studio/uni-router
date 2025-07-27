<template>
	<navigator
		:url="url"
		:open-type="openType"
		:delta="delta"
		:animation-type="animationType"
		:animation-duration="animationDuration"
		:render-link="renderLink"
		:hover-class="hoverClass"
		:hover-stop-propagation="hoverStopPropagation"
		:hover-start-time="hoverStartTime"
		:hover-stay-time="hoverStayTime"
		:target="target">
		<slot></slot>
	</navigator>
</template>

<script setup lang="ts">
import { ref, computed, type Slots, useSlots, watchEffect, unref, onMounted } from 'vue'
import { getOpenType, type RouterLinkActionType, type RouterLinkEmits, type RouterLinkProps } from './common'
import { buildUrl, deepMerge, parseLocation } from '@/utils'

const props = withDefaults(defineProps<RouterLinkProps>(), {
	method: 'push',
	animationDuration: 300,
	renderLink: true,
	hoverClass: 'none',
	hoverStopPropagation: false,
	hoverStartTime: 50,
	hoverStayTime: 600,
	target: 'self'
})

const emit = defineEmits<RouterLinkEmits>()
const slots: Slots = useSlots()

/** 函数注册的组件 props，使用 ref 包装 */
const propsRef = ref<RouterLinkProps>()

/** 计算属性，获取合并后的 props */
const getProps = computed<RouterLinkProps>(() => {
	return { ...props, ...unref(propsRef) }
})

/** 路由跳转的 URL */
const url = ref<string>()

/** 跳转类型 */
const openType = ref<RouterLinkProps['method']>()

/** 监听 getProps 的变化，更新 url 和 openType 的值 */
watchEffect(() => {
	const { to, method } = unref(getProps) || {}

	// 解析目标路由位置信息，获取路径和查询参数
	const { path, query } = parseLocation(to || '')
	// 构建目标路由位置信息
	url.value = buildUrl(path, query)

	// 跳转类型
	openType.value = getOpenType(method) as RouterLinkProps['method']
})

/**
 * 设置 props 的异步函数
 *
 * @param {RouterLinkProps} routerLinkProps - 要设置的 RouterLink props
 * @returns {Promise<void>}
 */
async function setProps(routerLinkProps: RouterLinkProps): Promise<void> {
	propsRef.value = deepMerge(unref(propsRef) || {}, routerLinkProps)
}

/** 组件的方法对象 */
const routerLinkActionType: RouterLinkActionType = {
	setProps
}

onMounted(() => {
	emit('register', routerLinkActionType)
})

defineExpose({
	...routerLinkActionType
})
</script>
