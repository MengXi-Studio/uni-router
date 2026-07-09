<template>
	<view class="content">
		<view class="card">
			<text class="card-title">EventChannel - 页面间通信</text>
			<text class="desc"
				>本项目启用 useUniEventChannel: true，所有导航方式（push/replace/relaunch）均返回内置 EventChannel。发起页通过 result.eventChannel.on() 监听目标页事件，目标页通过 usePageChannel() 获取通道。基于 uni.$emit
				全局事件总线，粘性事件缓存确保无论 emit 与 on 的先后顺序都能收到数据。</text
			>
		</view>

		<!-- 发送数据到被打开页面 -->
		<view class="card">
			<text class="card-title">发送数据到被打开页面</text>
			<text class="hint">push 返回的 eventChannel 可以向被打开页面 emit 事件</text>
			<view class="btn" @click="pushWithEventChannel">
				<text class="btn-text">push 并发送消息</text>
			</view>
		</view>

		<!-- 接收被打开页面的数据 -->
		<view class="card">
			<text class="card-title">接收被打开页面的数据</text>
			<text class="hint">push 后通过 result.eventChannel.on() 注册监听，目标页 emit 时触发回调</text>
			<view class="btn btn-secondary" @click="pushAndWaitReply">
				<text class="btn-text-secondary">push 并等待回复</text>
			</view>
		</view>

		<!-- EventChannel.once -->
		<view class="card">
			<text class="card-title">EventChannel.once - 一次性监听</text>
			<text class="hint">once() 监听的事件只触发一次后自动移除</text>
			<view class="btn btn-warning" @click="pushWithOnce">
				<text class="btn-text">push 并使用 once 监听</text>
			</view>
		</view>

		<!-- EventChannel.off -->
		<view class="card">
			<text class="card-title">EventChannel.off - 取消监听</text>
			<text class="hint">off() 取消已注册的事件监听器，后续 emit 不会触发该回调</text>
			<view class="btn btn-warning" @click="pushWithOff">
				<text class="btn-text">push 并演示 off 取消监听</text>
			</view>
		</view>

		<!-- 通信日志 -->
		<view class="card">
			<text class="card-title">通信日志</text>
			<view class="log-box" v-if="logs.length">
				<view class="log-item" v-for="(log, index) in logs" :key="index">
					<text class="log-text">{{ log }}</text>
				</view>
			</view>
			<view v-else class="empty-log">
				<text class="hint">暂无日志，点击上方按钮开始演示</text>
			</view>
		</view>

		<view class="btn btn-secondary" @click="goBack">
			<text class="btn-text-secondary">返回</text>
		</view>
	</view>
</template>

<script>
import router from '../../router'

export default {
	data() {
		return {
			logs: []
		}
	},
	methods: {
		addLog(msg) {
			const time = new Date().toLocaleTimeString()
			this.logs.unshift(`[${time}] ${msg}`)
			if (this.logs.length > 20) this.logs.pop()
		},
		async pushWithEventChannel() {
			this.logs = []
			this.addLog('发起 push 导航...')

			// useUniEventChannel: true 时 events 参数被忽略，通过 result.eventChannel.on() 注册监听
			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'ec', demo: 'event-channel' }
			})

			this.addLog('导航成功，获取到 eventChannel')

			// 监听目标页 emit 的事件（粘性缓存：目标页已 emit 的数据不会丢失）
			result.eventChannel?.on('receiveData', data => {
				this.addLog(`收到关于页数据: ${JSON.stringify(data)}`)
			})

			result.eventChannel?.emit('fromOpener', { msg: '你好，关于页！来自 EventChannel 演示' })
			this.addLog('已通过 eventChannel 发送消息到关于页')
		},
		async pushAndWaitReply() {
			this.logs = []
			this.addLog('发起 push 导航，等待关于页回复...')

			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'ec-reply', demo: 'event-channel-reply' }
			})

			this.addLog('导航成功，注册 replyFromAbout 监听，等待关于页回复...')

			result.eventChannel?.on('replyFromAbout', data => {
				this.addLog(`收到关于页回复: ${JSON.stringify(data)}`)
				uni.showToast({ title: `收到: ${data.msg}`, icon: 'none' })
			})

			setTimeout(() => {
				result.eventChannel?.emit('fromOpener', { msg: '请回复我！' })
				this.addLog('已发送 fromOpener 事件')
			}, 500)
		},
		async pushWithOnce() {
			this.logs = []
			this.addLog('发起 push 导航，使用 once 监听...')

			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'once', demo: 'once-listener' }
			})

			// on() 监听目标页的 onceEvent 事件
			result.eventChannel?.on('onceEvent', data => {
				this.addLog(`[once] 收到一次性事件: ${JSON.stringify(data)}`)
				uni.showToast({ title: `once: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
			})

			// once() 演示：只触发一次后自动移除
			result.eventChannel?.once('replyOnce', data => {
				this.addLog(`[once] 收到关于页一次性回复: ${JSON.stringify(data)}`)
			})

			this.addLog('导航成功，已注册 once 监听')
			setTimeout(() => {
				result.eventChannel?.emit('fromOpener', { msg: '请用 once 回复！' })
				this.addLog('已发送 fromOpener 事件')
			}, 500)
		},
		async pushWithOff() {
			this.logs = []
			this.addLog('发起 push 导航，演示 off 取消监听...')

			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'off', demo: 'off-listener' }
			})

			// 定义一个事件处理函数
			const offHandler = data => {
				this.addLog(`[off] 收到事件（取消前）: ${JSON.stringify(data)}`)
			}

			result.eventChannel?.on('offDemo', offHandler)
			this.addLog('导航成功，已注册 offDemo 监听')

			// 1 秒后取消监听
			setTimeout(() => {
				result.eventChannel?.off('offDemo', offHandler)
				this.addLog('已调用 off("offDemo", handler) 取消监听')

				// 再次 emit，此时不应触发回调
				result.eventChannel?.emit('offDemo', { msg: '此消息不应被接收' })
				this.addLog('已 emit offDemo 事件，但因已 off，回调不会触发')
			}, 1000)

			// 先发送一次让目标页能收到
			setTimeout(() => {
				result.eventChannel?.emit('fromOpener', { msg: '请回复 offDemo 事件！' })
				this.addLog('已发送 fromOpener 事件，等待关于页回复 offDemo')
			}, 500)
		},
		goBack() {
			router.back()
		}
	}
}
</script>

<style>
.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 30rpx;
}

.card {
	width: 100%;
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #007aff;
	margin-bottom: 20rpx;
}

.desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
}

.hint {
	font-size: 22rpx;
	color: #bbb;
}

.log-box {
	background: #1e1e1e;
	border-radius: 12rpx;
	padding: 20rpx;
	max-height: 400rpx;
	overflow-y: auto;
}

.log-item {
	padding: 8rpx 0;
}

.log-text {
	font-size: 22rpx;
	color: #0f0;
	font-family: monospace;
}

.empty-log {
	text-align: center;
	padding: 20rpx;
}

.btn {
	background: #007aff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	text-align: center;
}

.btn-secondary {
	background: #fff;
	border: 2rpx solid #007aff;
}

.btn-warning {
	background: #ff9500;
}

.btn-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
}

.btn-text-secondary {
	color: #007aff;
	font-size: 28rpx;
	font-weight: 500;
}
</style>
