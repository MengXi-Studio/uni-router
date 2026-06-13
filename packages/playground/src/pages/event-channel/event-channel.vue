<template>
	<view class="container">
		<view class="section">
			<view class="section-title">EventChannel - 页面间通信</view>
			<view class="info-text">
				通过 push 的 events 参数监听被打开页面发送的事件，通过返回的 eventChannel 向被打开页面发送数据，实现双向通信。
			</view>
		</view>

		<view class="section">
			<view class="section-title">发送数据到被打开页面</view>
			<view class="info-text">push 返回的 eventChannel 可以向被打开页面 emit 事件</view>
			<view class="btn" @click="pushWithEventChannel">push 并发送消息</view>
			<view class="code-block">
				const { eventChannel } = await router.push({&#10;  path: '/pages/detail/detail',&#10;  query: { id: 'ec' },&#10;  events: {&#10;    receiveData: (data) => {&#10;      console.log('收到被打开页面的数据:', data)&#10;    }&#10;  }&#10;})&#10;&#10;// 向被打开页面发送数据&#10;eventChannel.emit('fromOpener', { msg: '来自发起页' })
			</view>
		</view>

		<view class="section">
			<view class="section-title">接收被打开页面的数据</view>
			<view class="info-text">events 参数中定义的回调会在被打开页面 emit 对应事件时触发</view>
			<view class="btn btn-success" @click="pushAndWaitReply">push 并等待回复</view>
			<view class="code-block">
				const { eventChannel } = await router.push({&#10;  path: '/pages/detail/detail',&#10;  events: {&#10;    replyFromDetail: (data) => {&#10;      uni.showToast({ title: '收到: ' + data.msg, icon: 'none' })&#10;    }&#10;  }&#10;})&#10;&#10;// 延迟发送，等被打开页面准备好&#10;setTimeout(() => {&#10;  eventChannel.emit('fromOpener', { msg: '你好，详情页' })&#10;}, 500)
			</view>
		</view>

		<view class="section">
			<view class="section-title">通信日志</view>
			<view class="code-block" v-if="logs.length > 0">
				<view v-for="(log, index) in logs" :key="index">{{ log }}</view>
			</view>
			<view class="info-text" v-else>暂无日志，点击上方按钮开始演示</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()
const logs = ref<string[]>([])

function addLog(msg: string) {
	const time = new Date().toLocaleTimeString()
	logs.value.unshift(`[${time}] ${msg}`)
}

async function pushWithEventChannel() {
	logs.value = []
	addLog('发起 push 导航...')

	const result = await router.push({
		path: '/pages/detail/detail',
		query: { id: 'ec', demo: 'event-channel' },
		events: {
			receiveData: (data: Record<string, unknown>) => {
				addLog(`收到详情页数据: ${JSON.stringify(data)}`)
			}
		}
	})

	addLog('导航成功，获取到 eventChannel')

	// 向被打开页面发送数据
	result.eventChannel?.emit('fromOpener', { msg: '你好，详情页！来自 EventChannel 演示' })
	addLog('已通过 eventChannel 发送消息到详情页')
}

async function pushAndWaitReply() {
	logs.value = []
	addLog('发起 push 导航，等待详情页回复...')

	const result = await router.push({
		path: '/pages/detail/detail',
		query: { id: 'ec-reply', demo: 'event-channel-reply' },
		events: {
			replyFromDetail: (data: Record<string, unknown>) => {
				addLog(`收到详情页回复: ${JSON.stringify(data)}`)
				uni.showToast({ title: `收到: ${data.msg}`, icon: 'none' })
			}
		}
	})

	addLog('导航成功，等待详情页 emit replyFromDetail...')

	// 延迟发送，等被打开页面准备好
	setTimeout(() => {
		result.eventChannel?.emit('fromOpener', { msg: '请回复我！' })
		addLog('已发送 fromOpener 事件')
	}, 500)
}
</script>
