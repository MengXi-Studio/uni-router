<template>
	<view class="content">
		<view class="card">
			<text class="card-title">关于</text>
			<text class="desc">本项目演示 @meng-xi/vite-plugin 在 uni-app 中的完整功能。</text>
		</view>

		<!-- envGuard 验证 -->
		<view class="card">
			<text class="card-title">envGuard - 环境变量</text>
			<view class="info-row">
				<text class="info-label">VITE_APP_TITLE</text>
				<text class="info-value">{{ envTitle }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">VITE_API_URL</text>
				<text class="info-value">{{ envApiUrl }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">VITE_DEBUG</text>
				<text class="info-value">{{ envDebug }}</text>
			</view>
		</view>

		<!-- generateRouter 验证 -->
		<view class="card">
			<text class="card-title">generateRouter - 路由信息</text>
			<view class="info-row">
				<text class="info-label">当前路径</text>
				<text class="info-value">{{ currentPath }}</text>
			</view>
		</view>

		<view class="btn" @click="goBack">
			<text class="btn-text">返回首页</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			envTitle: '',
			envApiUrl: '',
			envDebug: '',
			currentPath: ''
		}
	},
	onLoad() {
		this.envTitle = import.meta.env.VITE_APP_TITLE || '-'
		this.envApiUrl = import.meta.env.VITE_API_URL || '-'
		this.envDebug = String(import.meta.env.VITE_DEBUG || '-')
		// #ifdef H5
		this.currentPath = window.location.pathname
		// #endif
	},
	methods: {
		goBack() {
			uni.navigateBack()
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
	background: #f9f9f9;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
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
	border-bottom: 1rpx solid #eee;
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
	margin-top: 20rpx;
	text-align: center;
	width: 100%;
}

.btn-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
}
</style>
