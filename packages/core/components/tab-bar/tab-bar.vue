<template>
	<view class="mx-tabbar" :class="{ 'mx-tabbar--fixed': fixed, 'mx-tabbar--border': border, 'mx-tabbar--safe-area': safeAreaInsetBottom }" :style="barStyle">
		<slot />
	</view>

	<!-- 占位元素：fixed 时生成等高占位，避免内容被遮挡 -->
	<view v-if="fixed && placeholder" class="mx-tabbar__placeholder" :class="{ 'mx-tabbar--safe-area': safeAreaInsetBottom }" />
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { type NavigationFailure, useRoute } from '@meng-xi/uni-router'
import { TABBAR_KEY, type TabBarContext, type TabBarItemProps } from './context'
import type { TabBarProps, TabBarEmits } from './type'

const props = withDefaults(defineProps<TabBarProps>(), {
	color: '#7A7E83',
	selectedColor: '#007AFF',
	bgColor: '#ffffff',
	borderStyle: 'black',
	fixed: true,
	border: true,
	placeholder: false,
	safeAreaInsetBottom: true,
	zIndex: 999
})

const emit = defineEmits<TabBarEmits>()

const route = useRoute()

/**
 * 子项注册表
 *
 * 子组件挂载时调用 register(uid) 登记，按挂载顺序获得索引；
 * 卸载时 unregister。索引随注册列表响应式重算，供 change 事件回传。
 */
const uids = ref<number[]>([])

function register(uid: number): number {
	if (!uids.value.includes(uid)) uids.value.push(uid)
	return uids.value.indexOf(uid)
}

function unregister(uid: number): void {
	const i = uids.value.indexOf(uid)
	if (i !== -1) uids.value.splice(i, 1)
}

function indexOf(uid: number): number {
	return uids.value.indexOf(uid)
}

function notifyChange(item: TabBarItemProps, index: number) {
	emit('change', item, index)
}

function notifyError(error: NavigationFailure) {
	emit('error', error)
}

provide(TABBAR_KEY, {
	selectedColor: computed(() => props.selectedColor),
	color: computed(() => props.color),
	activePath: computed(() => route.value.path),
	activeName: computed(() => route.value.name),
	beforeChange: computed(() => props.beforeChange),
	register,
	unregister,
	indexOf,
	notifyChange,
	notifyError
} satisfies TabBarContext)

/** 容器内联样式：背景、层级、边框；注入 --mx-tabbar-background 供徽标描边使用 */
const barStyle = computed(() => {
	const style: Record<string, string> = {
		backgroundColor: props.bgColor,
		'--mx-tabbar-background': props.bgColor,
		zIndex: String(props.zIndex)
	}
	if (props.border) {
		style.borderTopColor = props.borderStyle === 'white' ? '#f0f0f0' : '#e5e5e5'
		style.borderTopWidth = '1rpx'
		style.borderTopStyle = 'solid'
	}
	return style
})

defineOptions({ name: 'TabBar' })
</script>

<style lang="scss" scoped>
// SCSS 变量（编译时可被前置覆盖，!default 保证默认值）
$mx-tabbar-height: 50px !default;
$mx-tabbar-background: #ffffff !default;
$mx-tabbar-border-color: #e5e5e5 !default;

.mx-tabbar {
	display: flex;
	width: 100%;
	height: var(--mx-tabbar-height, #{$mx-tabbar-height});
	background-color: var(--mx-tabbar-background, #{$mx-tabbar-background});
}

.mx-tabbar--fixed {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
}

.mx-tabbar--border {
	border-top: 1rpx solid var(--mx-tabbar-border-color, #{$mx-tabbar-border-color});
}

.mx-tabbar--safe-area {
	// 适配 iPhone X 底部安全区域
	padding-bottom: env(safe-area-inset-bottom);
}

// fixed 模式下的等高占位元素
.mx-tabbar__placeholder {
	width: 100%;
	height: var(--mx-tabbar-height, #{$mx-tabbar-height});
}
</style>
