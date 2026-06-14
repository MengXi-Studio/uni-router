<template>
	<view class="content">
		<view class="card">
			<text class="card-title">关于</text>
			<text class="desc">本项目演示 @meng-xi/uni-router 在 uni-app 中的路由管理功能。</text>
		</view>

		<!-- 路由信息 -->
		<view class="card">
			<text class="card-title">当前路由信息</text>
			<view class="info-row">
				<text class="info-label">path</text>
				<text class="info-value">{{ currentRoute.path }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">name</text>
				<text class="info-value">{{ currentRoute.name || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">meta.title</text>
				<text class="info-value">{{ currentRoute.meta?.title || '-' }}</text>
			</view>
			<view class="info-row" v-if="currentRoute.query">
				<text class="info-label">query</text>
				<text class="info-value">{{ queryStr }}</text>
			</view>
		</view>

		<!-- 导航方式 -->
		<view class="card">
			<text class="card-title">导航方式</text>
			<view class="btn" @click="goBack">
				<text class="btn-text">router.back() 返回</text>
			</view>
			<view class="btn btn-secondary" @click="goHome">
				<text class="btn-text-secondary">router.push('/') 回首页</text>
			</view>
		</view>

		<!-- EventChannel -->
		<view class="card" v-if="hasEventChannel">
			<text class="card-title">EventChannel 通信</text>
			<text class="hint">本页通过 getOpenerEventChannel() 获取与发起页的通信通道</text>
			<view v-if="eventChannelMessages.length" class="log-box">
				<view class="log-item" v-for="(msg, index) in eventChannelMessages" :key="index">
					<text class="log-text">{{ msg }}</text>
				</view>
			</view>
			<view class="btn" @click="replyToOpener">
				<text class="btn-text">回复发起页</text>
			</view>
			<view class="btn btn-secondary" @click="replyOnceToOpener">
				<text class="btn-text-secondary">once 回复（一次性）</text>
			</view>
		</view>
	</view>
</template>

<script>
import router from '../../router'

export default {
	data() {
		return {
			currentRoute: {},
			hasEventChannel: false,
			eventChannelMessages: [],
			openerEventChannel: null
		}
	},
	computed: {
		queryStr() {
			const q = this.currentRoute.query
			if (!q || !Object.keys(q).length) return '-'
			return JSON.stringify(q)
		}
	},
	onLoad() {
		this.updateRouteInfo()
		this.initEventChannel()
	},
	onShow() {
		router.syncRoute()
		this.updateRouteInfo()
	},
	methods: {
		updateRouteInfo() {
			const route = router.currentRoute?.value || router.currentRoute || {}
			this.currentRoute = {
				path: route.path || '',
				name: route.name || '',
				meta: route.meta || {},
				query: route.query || {},
				fullPath: route.fullPath || ''
			}
		},
		initEventChannel() {
			const eventChannel = this.getOpenerEventChannel?.()
			if (eventChannel) {
				this.hasEventChannel = true
				this.openerEventChannel = eventChannel

				// 监听发起页发来的事件
				eventChannel.on('fromOpener', (data) => {
					this.eventChannelMessages.push(`收到 fromOpener: ${JSON.stringify(data)}`)
					uni.showToast({ title: `收到: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
				})

				// 向发起页发送数据
				eventChannel.emit('receiveData', { msg: '关于页已收到你的消息！' })
			}
		},
		replyToOpener() {
			if (this.openerEventChannel) {
				this.openerEventChannel.emit('replyFromAbout', { msg: '这是关于页的回复！' })
				this.eventChannelMessages.push('已发送 replyFromAbout 事件到发起页')
			}
		},
		replyOnceToOpener() {
			if (this.openerEventChannel) {
				this.openerEventChannel.emit('onceEvent', { msg: '这是一次性事件（once）' })
				this.eventChannelMessages.push('已发送 onceEvent 事件到发起页')
			}
		},
		goBack() {
			router.back()
		},
		goHome() {
			router.push('/pages/index/index')
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

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-label {
	font-size: 26rpx;
	color: #999;
}

.info-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	word-break: break-all;
	max-width: 60%;
	text-align: right;
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
