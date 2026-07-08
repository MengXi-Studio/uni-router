<template>
	<view class="container">
		<view class="section">
			<view class="section-title">详情页</view>
			<view class="info-text">本页通过 push 导航到达，接收了以下查询参数：</view>
			<view class="code-block">
				path: {{ route.path }}\nname: {{ route.name || '-' }}\nfullPath: {{ route.fullPath }}\n\nquery:\n<template
					v-for="(val, key) in route.query" :key="key"> {{ key }}: {{ val }}\n</template>
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
				queryInt('id'): {{ route.queryInt('id') ?? '-' }}\nqueryNumber('price'): {{ route.queryNumber('price') ?? '-'
				}}\nqueryBool('enabled'): {{ route.queryBool('enabled') ?? '-' }}\nqueryBool('visible'):
				{{ route.queryBool('visible') ?? '-' }}
			</view>
		</view>

		<view class="section" v-if="eventChannelMessages.length > 0">
			<view class="section-title">EventChannel 收到的消息</view>
			<view class="info-text">
				通过 usePageChannel() 获取通信通道，无论页面是通过 push / replace / relaunch 哪种方式进入，都能接收导航方发送的事件。
			</view>
			<view class="code-block">
				<view v-for="(msg, index) in eventChannelMessages" :key="index">{{ msg }}</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">useRoute() - 获取当前路由（响应式）</view>
			<view class="info-text">useRoute() 返回 Ref{{ '<RouteLocation>' }}，路由变化时自动更新组件。</view>
			<view class="code-block"> import { useRoute } from '@meng-xi/uni-router'\nconst route = useRoute()\n// script 中:
				route.value.query.id\n// 模板中: route.query.id（自动解包） </view>
		</view>

		<view class="section">
			<view class="section-title">useRouter() - 获取路由器实例</view>
			<view class="code-block"> import { useRouter } from '@meng-xi/uni-router'\nconst router = useRouter()\nawait
				router.back() </view>
		</view>

		<view class="section">
			<view class="section-title">router.syncRoute() - 自动同步路由状态</view>
			<view class="info-text">
				路由器在 install() 时已通过 app.mixin({ onShow() { router.syncRoute() } }) 注册全局 mixin，会在每个页面 onShow
				自动同步 currentRoute 与页面栈。物理返回键、浏览器后退等场景无需手动调用。
			</view>
			<view class="info-text" style="color: #ff9500"> 仅在 onLoad 等 onShow 之前的生命周期需要立即读取路由信息时，才需手动调用 syncRoute()。 </view>
			<view class="code-block"> // install() 内部已注册，无需手动添加：\n// app.mixin({ onShow() { router.syncRoute() } })\n\n// 仅在 onLoad 中需要时手动调用：\nimport { onLoad } from '@dcloudio/uni-app'\n\nonLoad(() => {\n router.syncRoute()\n console.log(router.currentRoute.params)\n}) </view>
		</view>

		<view class="section">
			<view class="section-title">back() 后 params 不丢失</view>
			<view class="info-text">
				push 时实际导航 URL 会保留 __params_key（route.query 中不可见），back() 返回原页面时 syncCurrentRoute 从 URL 读取 key 并用 peek 重建 params。
			</view>
			<view class="info-text" style="color: #007aff"> 本页若通过带 params 的 push 进入，点击下方"返回上一页"后再 push 一次相同位置，params 仍可读取。 </view>
			<view class="code-block"> // 1. 首次 push 带 params\nawait router.push({\n path: '/pages/detail/detail',\n params: { fromIndex: true }\n})\n// → URL: /pages/detail/detail?__params_key=xxx\n\n// 2. back() 返回原页面\nawait router.back()\n// → syncCurrentRoute 从 URL 读取 key，peek 重建 params\n// → route.params = { fromIndex: true }（不丢失）</view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
		<view class="btn btn-success" @click="replyToOpener" v-if="hasEventChannel">通过 EventChannel 回复发起页</view>
		<view class="btn btn-warn" @click="replyOnceToOpener" v-if="hasEventChannel">通过 once 回复发起页（一次性）</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter, useRoute, usePageChannel } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()
const eventChannelMessages = ref<string[]>([])
const hasParams = computed(() => Object.keys(route.value.params).length > 0)

// usePageChannel() 内部读取 route.params.__navId 获取通信通道
// 仅在 useUniEventChannel: true 时有效，无 navId 时返回 no-op channel（不会报错）
// 页面卸载时自动清理监听器，无需手动 destroy
const channel = usePageChannel()
const hasEventChannel = computed(() => !!route.value.params?.__navId)

// onLoad 早于 onShow，若需在此阶段读取路由信息（含 params），可手动调用 syncRoute()
// 路由器在 install() 时已注册全局 mixin，会在 onShow 自动 syncRoute，此处手动调用会去重跳过
onLoad(() => {
	router.syncRoute()
	console.log('[detail onLoad] params:', route.value.params, 'query:', route.value.query)
})

// 监听发起页发送的事件
channel.on('fromOpener', (data: Record<string, unknown>) => {
	eventChannelMessages.value.push(`fromOpener: ${JSON.stringify(data)}`)
})

// 使用 once 监听一次性事件
channel.once('fromOpener', (data: Record<string, unknown>) => {
	eventChannelMessages.value.push(`[once] fromOpener: ${JSON.stringify(data)}`)
})

function replyToOpener() {
	channel.emit('receiveData', { msg: '详情页收到你的消息了！' })
	channel.emit('replyFromDetail', { msg: '这是详情页的回复' })
	uni.showToast({ title: '已回复发起页', icon: 'none' })
}

function replyOnceToOpener() {
	channel.emit('onceEvent', { msg: '这是一次性回复' })
	channel.emit('replyOnce', { msg: 'once 回复' })
	uni.showToast({ title: '已通过 once 回复', icon: 'none' })
}

function goBack() {
	router.back()
}
</script>
