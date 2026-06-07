<template>
	<view class="content">
		<view class="card">
			<text class="card-title">路由守卫演示</text>
			<text class="desc">此页面展示 uni-router 的路由守卫功能。</text>
		</view>

		<!-- 守卫类型说明 -->
		<view class="card">
			<text class="card-title">守卫类型</text>
			<view class="guard-item">
				<text class="guard-name">beforeEach</text>
				<text class="guard-desc">全局前置守卫，导航前执行，可中止/放行/重定向</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">beforeResolve</text>
				<text class="guard-desc">全局解析守卫，所有守卫完成后执行</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">afterEach</text>
				<text class="guard-desc">全局后置钩子，导航完成后执行</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">beforeEnter</text>
				<text class="guard-desc">路由独享守卫，进入特定路由时触发</text>
			</view>
		</view>

		<!-- 守卫日志 -->
		<view class="card">
			<text class="card-title">守卫日志</text>
			<text class="hint">打开浏览器控制台查看守卫执行日志</text>
			<view class="log-box" v-if="logs.length">
				<view class="log-item" v-for="(log, index) in logs" :key="index">
					<text class="log-text">{{ log }}</text>
				</view>
			</view>
			<view v-else class="empty-log">
				<text class="hint">暂无日志，请执行导航操作</text>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="card">
			<text class="card-title">操作</text>
			<view class="btn" @click="goToProtected">
				<text class="btn-text">访问受保护页面（触发 beforeEach 拦截）</text>
			</view>
			<view class="btn btn-secondary" @click="goAbout">
				<text class="btn-text-secondary">导航到关于页（触发完整守卫链）</text>
			</view>
			<view class="btn btn-secondary" @click="goBack">
				<text class="btn-text-secondary">返回</text>
			</view>
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
	onLoad() {
		this.addLog('进入守卫演示页面')
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
		async goToProtected() {
			this.addLog('尝试访问受保护页面...')
			try {
				await router.push('/pages/protected/index')
				this.addLog('导航成功（已登录）')
			} catch (e) {
				this.addLog(`导航被拦截: ${e.message || e}`)
			}
		},
		async goAbout() {
			this.addLog('导航到关于页...')
			try {
				await router.push('/pages/about/index')
				this.addLog('导航成功')
			} catch (e) {
				this.addLog(`导航失败: ${e.message || e}`)
			}
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

.guard-item {
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.guard-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.guard-desc {
	font-size: 24rpx;
	color: #999;
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
