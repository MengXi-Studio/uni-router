<template>
	<view class="container">
		<view class="section">
			<view class="section-title">EventChannel - 页面间通信</view>
			<view class="info-text"> 启用 useUniEventChannel 后，所有导航方法（push / replace / relaunch）都支持页面间双向通信。基于 uni.$emit/$on 全局事件总线实现，通过 navigationId 隔离事件通道。 </view>
		</view>

		<view class="section">
			<view class="section-title">push + EventChannel（基础用法）</view>
			<view class="info-text">push 返回的 eventChannel 可以向被打开页面 emit 事件，events 参数监听被打开页面的回复</view>
			<view class="btn" @click="pushWithEventChannel">push 并发送消息</view>
			<view class="code-block">
				const { eventChannel } = await router.push({&#10; path: '/pages/detail/detail',&#10; query: { id: 'ec' },&#10; events: {&#10; receiveData: (data) => {&#10; console.log('收到被打开页面的数据:', data)&#10; }&#10;
				}&#10;})&#10;&#10;// 向被打开页面发送数据&#10;eventChannel.emit('fromOpener', { msg: '来自发起页' })
			</view>
		</view>

		<view class="section">
			<view class="section-title">push + 等待回复</view>
			<view class="info-text">events 参数中定义的回调会在被打开页面 emit 对应事件时触发</view>
			<view class="btn btn-success" @click="pushAndWaitReply">push 并等待回复</view>
			<view class="code-block">
				const { eventChannel } = await router.push({&#10; path: '/pages/detail/detail',&#10; events: {&#10; replyFromDetail: (data) => {&#10; uni.showToast({ title: '收到: ' + data.msg, icon: 'none' })&#10; }&#10;
				}&#10;})&#10;&#10;// 延迟发送，等被打开页面准备好&#10;setTimeout(() => {&#10; eventChannel.emit('fromOpener', { msg: '你好，详情页' })&#10;}, 500)
			</view>
		</view>

		<view class="section">
			<view class="section-title">replace + EventChannel（新增能力）</view>
			<view class="info-text"> 启用 useUniEventChannel 后，replace 也返回 eventChannel，可在替换页面后与目标页面通信。原生 uni.redirectTo 不支持此能力。 </view>
			<view class="btn btn-warn" @click="replaceWithEventChannel">replace 并发送消息</view>
			<view class="code-block">
				// replace 模式同样返回 eventChannel&#10;const { eventChannel } = await router.replace({&#10; path: '/pages/detail/detail',&#10; query: { id: 'replace-ec' },&#10; events: {&#10; receiveData: (data) =>
				console.log('收到:', data)&#10; }&#10;})&#10;&#10;eventChannel.emit('fromOpener', { msg: '来自 replace 导航' })
			</view>
		</view>

		<view class="section">
			<view class="section-title">relaunch + EventChannel（新增能力）</view>
			<view class="info-text"> relaunch 关闭所有页面后打开目标页面，同样支持 eventChannel 通信。适用于退出登录后跳转登录页并传递上下文。 </view>
			<view class="btn btn-danger" @click="relaunchWithEventChannel">relaunch 并发送消息</view>
			<view class="code-block">
				// relaunch 模式也返回 eventChannel&#10;const { eventChannel } = await router.relaunch({&#10; path: '/pages/detail/detail',&#10; query: { id: 'relaunch-ec' },&#10; events: {&#10; receiveData: (data) =>
				console.log('收到:', data)&#10; }&#10;})&#10;&#10;eventChannel.emit('fromOpener', { msg: '来自 relaunch 导航' })
			</view>
		</view>

		<view class="section">
			<view class="section-title">EventChannel.once - 一次性监听</view>
			<view class="info-text">once() 监听的事件只触发一次后自动移除，适合只需响应一次的场景。</view>
			<view class="btn btn-warn" @click="pushWithOnce">push 并使用 once 监听</view>
			<view class="code-block">
				const { eventChannel } = await router.push({&#10; path: '/pages/detail/detail',&#10; query: { id: 'once' },&#10; events: {&#10; onceEvent: (data) => {&#10; console.log('仅触发一次:', data)&#10; }&#10;
				}&#10;})&#10;&#10;// 也可以在 eventChannel 上使用 once&#10;eventChannel.once('replyOnce', (data) => {&#10; console.log('只收到一次:', data)&#10;})
			</view>
		</view>

		<view class="section">
			<view class="section-title">目标页面：usePageChannel()</view>
			<view class="info-text"> 目标页面通过 usePageChannel() 获取通道，内部自动读取 route.params.__navId。无论页面由 push / replace / relaunch 哪种方式进入，都能接收事件。页面卸载时自动清理监听器。 </view>
			<view class="code-block">
				import { usePageChannel } from '@meng-xi/uni-router'&#10;&#10;const channel = usePageChannel()&#10;&#10;// 监听导航方事件&#10;channel.on('fromOpener', (data) => {&#10; console.log('收到:',
				data)&#10;})&#10;&#10;// 向导航方发送事件&#10;channel.emit('receiveData', { msg: '收到消息了' })
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

async function replaceWithEventChannel() {
	logs.value = []
	addLog('发起 replace 导航（替换当前页面）...')

	const result = await router.replace({
		path: '/pages/detail/detail',
		query: { id: 'replace-ec', demo: 'replace-event-channel' },
		events: {
			receiveData: (data: Record<string, unknown>) => {
				addLog(`[replace] 收到详情页数据: ${JSON.stringify(data)}`)
			}
		}
	})

	addLog('replace 导航成功，获取到 eventChannel')

	// 延迟发送，等目标页面准备好
	setTimeout(() => {
		result.eventChannel?.emit('fromOpener', { msg: '来自 replace 导航的消息' })
		addLog('已通过 eventChannel 发送消息到详情页')
	}, 500)
}

async function relaunchWithEventChannel() {
	logs.value = []
	addLog('发起 relaunch 导航（关闭所有页面）...')

	const result = await router.relaunch({
		path: '/pages/detail/detail',
		query: { id: 'relaunch-ec', demo: 'relaunch-event-channel' },
		events: {
			receiveData: (data: Record<string, unknown>) => {
				addLog(`[relaunch] 收到详情页数据: ${JSON.stringify(data)}`)
			}
		}
	})

	addLog('relaunch 导航成功，获取到 eventChannel')

	// 延迟发送，等目标页面准备好
	setTimeout(() => {
		result.eventChannel?.emit('fromOpener', { msg: '来自 relaunch 导航的消息' })
		addLog('已通过 eventChannel 发送消息到详情页')
	}, 500)
}

async function pushWithOnce() {
	logs.value = []
	addLog('发起 push 导航，使用 once 监听...')

	const result = await router.push({
		path: '/pages/detail/detail',
		query: { id: 'once', demo: 'once-listener' },
		events: {
			onceEvent: (data: Record<string, unknown>) => {
				addLog(`[once] 收到一次性事件: ${JSON.stringify(data)}`)
				uni.showToast({ title: `once: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
			}
		}
	})

	// 在 eventChannel 上也使用 once 监听
	result.eventChannel?.once('replyOnce', (data: Record<string, unknown>) => {
		addLog(`[once] 收到详情页一次性回复: ${JSON.stringify(data)}`)
	})

	addLog('导航成功，已注册 once 监听')

	// 延迟发送，等被打开页面准备好
	setTimeout(() => {
		result.eventChannel?.emit('fromOpener', { msg: '请用 once 回复！' })
		addLog('已发送 fromOpener 事件')
	}, 500)
}
</script>
