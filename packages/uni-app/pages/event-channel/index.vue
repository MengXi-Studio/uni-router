<template>
	<view class="content">
		<view class="card">
			<text class="card-title">EventChannel - 页面间通信</text>
			<text class="desc">通过 push 的 events 参数监听被打开页面发送的事件，通过返回的 eventChannel 向被打开页面发送数据，实现双向通信。</text>
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
			<text class="hint">events 参数中定义的回调会在被打开页面 emit 对应事件时触发</text>
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
	onShow() {
		router.syncRoute()
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

			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'ec', demo: 'event-channel' },
				events: {
					receiveData: (data) => {
						this.addLog(`收到关于页数据: ${JSON.stringify(data)}`)
					}
				}
			})

			this.addLog('导航成功，获取到 eventChannel')
			result.eventChannel?.emit('fromOpener', { msg: '你好，关于页！来自 EventChannel 演示' })
			this.addLog('已通过 eventChannel 发送消息到关于页')
		},
		async pushAndWaitReply() {
			this.logs = []
			this.addLog('发起 push 导航，等待关于页回复...')

			const result = await router.push({
				path: '/pages/about/index',
				query: { id: 'ec-reply', demo: 'event-channel-reply' },
				events: {
					replyFromAbout: (data) => {
						this.addLog(`收到关于页回复: ${JSON.stringify(data)}`)
						uni.showToast({ title: `收到: ${data.msg}`, icon: 'none' })
					}
				}
			})

			this.addLog('导航成功，等待关于页 emit replyFromAbout...')
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
				query: { id: 'once', demo: 'once-listener' },
				events: {
					onceEvent: (data) => {
						this.addLog(`[once] 收到一次性事件: ${JSON.stringify(data)}`)
						uni.showToast({ title: `once: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
					}
				}
			})

			result.eventChannel?.once('replyOnce', (data) => {
				this.addLog(`[once] 收到关于页一次性回复: ${JSON.stringify(data)}`)
			})

			this.addLog('导航成功，已注册 once 监听')
			setTimeout(() => {
				result.eventChannel?.emit('fromOpener', { msg: '请用 once 回复！' })
				this.addLog('已发送 fromOpener 事件')
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
