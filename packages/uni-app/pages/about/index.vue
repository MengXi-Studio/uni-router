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
			<view class="info-row" v-if="currentRoute.query && Object.keys(currentRoute.query).length">
				<text class="info-label">query</text>
				<text class="info-value">{{ queryStr }}</text>
			</view>
			<view class="info-row" v-if="hasParams">
				<text class="info-label">params</text>
				<text class="info-value">{{ paramsStr }}</text>
			</view>
		</view>

		<!-- 查询参数增强 -->
		<view class="card" v-if="hasQuery">
			<text class="card-title">查询参数增强方法</text>
			<text class="hint">RouteLocation 提供 queryInt / queryNumber / queryBool 便捷方法</text>
			<view class="info-row" v-if="currentRoute.query.id">
				<text class="info-label">queryInt('id')</text>
				<text class="info-value">{{ queryIntResult }}</text>
			</view>
			<view class="info-row" v-if="currentRoute.query.price">
				<text class="info-label">queryNumber('price')</text>
				<text class="info-value">{{ queryNumberResult }}</text>
			</view>
			<view class="info-row" v-if="currentRoute.query.enabled">
				<text class="info-label">queryBool('enabled')</text>
				<text class="info-value">{{ queryBoolResult }}</text>
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
			<text class="hint">本页通过 usePageChannel() 获取与发起页的通信通道（基于 uni.$emit 全局事件总线，粘性事件缓存确保时序安全）</text>
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
import { usePageChannel, noopChannel } from '../../uni_modules/mxuni-router-v2/js_sdk/index.js'

export default {
	// usePageChannel() 在 setup 顶层调用，读取 route.params.__navId 获取通信通道
	// 路由器在导航时已将 __navId 从 query 提取到 params（applySyncHooks），因此 setup 执行时已有值
	// 无 __navId 时（如直接 URL 访问）返回 noopChannel，所有方法为空操作，避免调用方判空
	// 页面卸载时自动清理监听器，无需手动 destroy
	setup() {
		const channel = usePageChannel()
		const hasEventChannel = channel !== noopChannel

		// 直接在 setup 中注册事件监听器，无需等到 onLoad
		if (hasEventChannel) {
			channel.on('fromOpener', data => {
				uni.showToast({ title: `收到: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
			})

			// 粘性事件缓存：即使发起页尚未注册监听也能收到
			channel.emit('receiveData', { msg: '关于页已收到你的消息！' })
		}

		return { channel, hasEventChannel }
	},
	data() {
		return {
			currentRoute: {},
			eventChannelMessages: []
		}
	},
	computed: {
		queryStr() {
			const q = this.currentRoute.query
			if (!q || !Object.keys(q).length) return '-'
			return JSON.stringify(q)
		},
		hasParams() {
			const p = this.currentRoute.params
			return p && Object.keys(p).length > 0
		},
		paramsStr() {
			const p = this.currentRoute.params
			if (!p || !Object.keys(p).length) return '{}'
			return JSON.stringify(p)
		},
		hasQuery() {
			const q = this.currentRoute.query
			return q && Object.keys(q).length > 0
		},
		queryIntResult() {
			const route = router.currentRoute?.value || router.currentRoute
			return route.queryInt ? route.queryInt('id') : '-'
		},
		queryNumberResult() {
			const route = router.currentRoute?.value || router.currentRoute
			return route.queryNumber ? route.queryNumber('price') : '-'
		},
		queryBoolResult() {
			const route = router.currentRoute?.value || router.currentRoute
			return route.queryBool ? route.queryBool('enabled') : '-'
		}
	},
	onLoad() {
		this.updateRouteInfo()
	},
	onShow() {
		// syncRoute() 已由路由器全局 mixin 在 onShow 自动调用
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
				fullPath: route.fullPath || '',
				params: route.params || {}
			}
		},
		replyToOpener() {
			if (this.channel) {
				this.channel.emit('replyFromAbout', { msg: '这是关于页的回复！' })
				this.eventChannelMessages.push('已发送 replyFromAbout 事件到发起页')
			}
		},
		replyOnceToOpener() {
			if (this.channel) {
				this.channel.emit('onceEvent', { msg: '这是一次性事件（once）' })
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
