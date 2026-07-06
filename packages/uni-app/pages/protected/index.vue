<template>
	<view class="content">
		<view class="card">
			<text class="card-title">受保护页面</text>
			<text class="desc">此页面需要登录才能访问，未登录时会被路由守卫拦截并重定向到登录页。</text>
		</view>

		<!-- 路由信息 -->
		<view class="card">
			<text class="card-title">路由元信息</text>
			<view class="info-row">
				<text class="info-label">path</text>
				<text class="info-value">{{ currentRoute.path }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">meta.title</text>
				<text class="info-value">{{ currentRoute.meta?.title || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">meta.requireAuth</text>
				<text class="info-value active">true</text>
			</view>
		</view>

		<view class="card">
			<text class="desc">你能看到此页面，说明 beforeEach 守卫已验证登录状态并放行。</text>
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
			currentRoute: {}
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
				meta: route.meta || {}
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
}

.info-value.active {
	color: #07c160;
}

.btn-secondary {
	background: #fff;
	border: 2rpx solid #007aff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	text-align: center;
}

.btn-text-secondary {
	color: #007aff;
	font-size: 28rpx;
	font-weight: 500;
}
</style>
