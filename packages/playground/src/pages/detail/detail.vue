<template>
	<view class="container">
		<view class="section">
			<view class="section-title">详情页</view>
			<view class="info-text">本页通过 push 导航到达，接收了以下查询参数：</view>
			<view class="code-block">
				path: {{ route.path }}\nname: {{ route.name || '-' }}\nfullPath: {{ route.fullPath }}\n\nquery:\n<template v-for="(val, key) in route.query" :key="key"> {{ key }}: {{ val }}\n</template>
			</view>
		</view>

		<view class="section" v-if="hasParams">
			<view class="section-title">params - 页面参数</view>
			<view class="info-text">通过 push 的 params 选项传递，不暴露在 URL 中，支持复杂数据。</view>
			<view class="code-block">
				<view v-for="(val, key) in route.params" :key="key"> {{ key }}: {{ JSON.stringify(val) }}</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">查询参数增强方法</view>
			<view class="info-text">RouteLocation 提供 queryInt / queryNumber / queryBool 便捷方法。</view>
			<view class="code-block">
				queryInt('id'): {{ route.queryInt('id') ?? '-' }}\nqueryNumber('price'): {{ route.queryNumber('price') ?? '-' }}\nqueryBool('enabled'): {{ route.queryBool('enabled') ?? '-' }}\nqueryBool('visible'):
				{{ route.queryBool('visible') ?? '-' }}
			</view>
		</view>

		<view class="section" v-if="eventChannelMessages.length > 0">
			<view class="section-title">EventChannel 收到的消息</view>
			<view class="code-block">
				<view v-for="(msg, index) in eventChannelMessages" :key="index">{{ msg }}</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">useRoute() - 获取当前路由（响应式）</view>
			<view class="info-text">useRoute() 返回 Ref&lt;RouteLocation&gt;，路由变化时自动更新组件。</view>
			<view class="code-block"> import { useRoute } from '@meng-xi/uni-router'\nconst route = useRoute()\n// script 中: route.value.query.id\n// 模板中: route.query.id（自动解包） </view>
		</view>

		<view class="section">
			<view class="section-title">useRouter() - 获取路由器实例</view>
			<view class="code-block"> import { useRouter } from '@meng-xi/uni-router'\nconst router = useRouter()\nawait router.back() </view>
		</view>

		<view class="section">
			<view class="section-title">router.syncRoute() - 同步路由状态</view>
			<view class="info-text"> 当页面通过浏览器后退、物理返回键等非路由器方式切换时，路由器的 currentRoute 可能与实际页面不同步。建议在每个页面的 onShow 生命周期中调用 syncRoute() 更新路由状态。 </view>
			<view class="code-block"> import { onShow } from '@dcloudio/uni-app'\n\nonShow(() => {\n // 从页面栈读取当前页面信息并更新路由状态\n router.syncRoute()\n}) </view>
			<view class="info-text" style="color: #007aff">本页已在 onShow 中调用 syncRoute()，请查看控制台日志。</view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
		<view class="btn btn-success" @click="replyToOpener" v-if="hasEventChannel">通过 EventChannel 回复发起页</view>
		<view class="btn btn-warn" @click="replyOnceToOpener" v-if="hasEventChannel">通过 once 回复发起页（一次性）</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute, type EventChannel } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()
const eventChannelMessages = ref<string[]>([])
const hasEventChannel = ref(false)
const hasParams = computed(() => Object.keys(route.value.params).length > 0)

let eventChannel: EventChannel | null = null

// 在 onShow 中调用 syncRoute()，处理浏览器后退、物理返回键等非路由器导航场景
// 当页面通过这些方式重新显示时，路由器的 currentRoute 可能与实际页面不同步
onShow(() => {
	router.syncRoute()
	console.log('[detail onShow] syncRoute() 已调用，当前路由:', router.currentRoute.fullPath)
})

onMounted(() => {
	// 获取当前页面的 EventChannel
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1] as any
	if (currentPage && currentPage.getOpenerEventChannel) {
		eventChannel = currentPage.getOpenerEventChannel()
		hasEventChannel.value = true

		// 监听发起页发送的事件
		eventChannel?.on('fromOpener', (data: Record<string, unknown>) => {
			eventChannelMessages.value.push(`fromOpener: ${JSON.stringify(data)}`)
		})

		// 使用 once 监听一次性事件
		eventChannel?.once('fromOpener', (data: Record<string, unknown>) => {
			eventChannelMessages.value.push(`[once] fromOpener: ${JSON.stringify(data)}`)
		})
	}
})

function replyToOpener() {
	if (eventChannel) {
		eventChannel.emit('receiveData', { msg: '详情页收到你的消息了！' })
		eventChannel.emit('replyFromDetail', { msg: '这是详情页的回复' })
		uni.showToast({ title: '已回复发起页', icon: 'none' })
	}
}

function replyOnceToOpener() {
	if (eventChannel) {
		eventChannel.emit('onceEvent', { msg: '这是一次性回复' })
		eventChannel.emit('replyOnce', { msg: 'once 回复' })
		uni.showToast({ title: '已通过 once 回复', icon: 'none' })
	}
}

function goBack() {
	router.back()
}
</script>
