<template>
	<view class="mx-tabbar__item" :class="{ 'mx-tabbar__item--active': isActive }" @click="onClick">
		<view class="mx-tabbar__icon-wrap">
			<slot name="icon" :active="isActive">
				<image v-if="iconPath" class="mx-tabbar__icon" :src="isActive ? selectedIconPath || iconPath : iconPath" mode="aspectFit" />
			</slot>
			<!-- 小红点：dot 优先于 badge -->
			<view v-if="dot" class="mx-tabbar__dot" :style="badgeColor ? { backgroundColor: badgeColor } : undefined" />
			<view v-else-if="badgeText" class="mx-tabbar__badge" :style="badgeColor ? { backgroundColor: badgeColor } : undefined">{{ badgeText }}</view>
		</view>
		<text class="mx-tabbar__text" :style="{ color: textColor }">
			<slot>{{ text }}</slot>
		</text>
	</view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, onUnmounted } from 'vue'
import { useRouter, type NavigationFailure } from '@meng-xi/uni-router'
import { TABBAR_KEY, type TabBarItemProps } from '../tab-bar/context'

const props = defineProps<TabBarItemProps>()

const ctx = inject(TABBAR_KEY)
if (!ctx) {
	throw new Error('[TabBarItem] 必须作为 <TabBar> 的子组件使用')
}

const router = useRouter()
const uid = getCurrentInstance()?.uid ?? 0

ctx.register(uid)
onUnmounted(() => ctx.unregister(uid))

/** 当前项在兄弟中的索引（响应式，随注册列表变化重算） */
const index = computed(() => ctx.indexOf(uid))

/** 是否激活：按 to 的 path 或 name 维度匹配当前路由 */
const isActive = computed(() => {
	const to = props.to
	if (typeof to === 'string') return ctx.activePath.value === to
	if ('path' in to && to.path) return ctx.activePath.value === to.path
	if ('name' in to && to.name) return ctx.activeName.value === to.name
	return false
})

const textColor = computed(() => (isActive.value ? ctx.selectedColor.value : ctx.color.value))

/** 徽标文本（dot 时不渲染文本，仅占位判断） */
const badgeText = computed(() => {
	if (props.dot) return ''
	const badge = props.badge
	if (badge === undefined || badge === null || badge === '') return ''
	if (typeof badge === 'number') {
		if (badge <= 0) return ''
		if (props.badgeMax && badge > props.badgeMax) return `${props.badgeMax}+`
		return String(badge)
	}
	return String(badge)
})

/** 点击：经过拦截器后通过路由器导航以走完整守卫链 */
async function onClick() {
	if (isActive.value) return

	const idx = index.value
	const interceptor = ctx?.beforeChange?.value
	// 拦截器：返回 false 或抛异常则中止切换（快照 props 作为不可变入参）
	if (interceptor) {
		try {
			if (!(await interceptor({ ...props }, idx))) return
		} catch {
			return
		}
	}

	try {
		// 路由器内部根据 meta.isTab 自动选择 uni.switchTab，
		// 这样可经过完整的守卫链（beforeEach → beforeResolve → afterEach）
		if (props.replace) {
			await router.replace(props.to)
		} else {
			await router.push(props.to)
		}
		ctx?.notifyChange?.({ ...props }, idx)
	} catch (error) {
		ctx?.notifyError?.(error as NavigationFailure)
	}
}

defineOptions({ name: 'TabBarItem' })
</script>

<style scoped>
.mx-tabbar__item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
}

.mx-tabbar__icon-wrap {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mx-tabbar__icon {
	width: 24px;
	height: 24px;
}

.mx-tabbar__text {
	font-size: 10px;
	line-height: 1.2;
}

/* 小红点 */
.mx-tabbar__dot {
	position: absolute;
	top: -2px;
	right: -8px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: #ee0a24;
	/* 描边环色取自父容器注入的背景变量，使徽标与底色镂空 */
	box-shadow: 0 0 0 1px var(--mx-tabbar-background, #ffffff);
}

/* 数字 / 文本徽标 */
.mx-tabbar__badge {
	position: absolute;
	top: -8px;
	right: -14px;
	min-width: 16px;
	padding: 0 3px;
	font-size: 10px;
	line-height: 16px;
	color: #ffffff;
	text-align: center;
	border-radius: 8px;
	background-color: #ee0a24;
	box-sizing: border-box;
	box-shadow: 0 0 0 1px var(--mx-tabbar-background, #ffffff);
}
</style>
