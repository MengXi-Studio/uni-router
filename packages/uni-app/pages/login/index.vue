<template>
	<view class="content">
		<view class="card">
			<text class="card-title">登录</text>
			<text class="hint">模拟登录操作，登录后将跳转回原页面</text>
		</view>

		<!-- 重定向信息 -->
		<view class="card" v-if="redirectUrl">
			<view class="info-row">
				<text class="info-label">来源页面</text>
				<text class="info-value">{{ redirectUrl }}</text>
			</view>
		</view>

		<!-- 登录表单 -->
		<view class="card">
			<view class="form-item">
				<text class="form-label">用户名</text>
				<input class="form-input" v-model="username" placeholder="请输入用户名" />
			</view>
			<view class="form-item">
				<text class="form-label">密码</text>
				<input class="form-input" v-model="password" placeholder="请输入密码" type="safe-password" />
			</view>
			<view class="btn" @click="handleLogin">
				<text class="btn-text">登录</text>
			</view>
		</view>

		<view class="card">
			<text class="hint">提示：输入任意用户名和密码即可模拟登录</text>
		</view>
	</view>
</template>

<script>
import router, { auth } from '../../router'

export default {
	data() {
		return {
			username: '',
			password: '',
			redirectUrl: ''
		}
	},
	onLoad(query) {
		if (query.redirect) {
			this.redirectUrl = Array.isArray(query.redirect) ? query.redirect[0] : query.redirect
		}
	},
	onShow() {
		router.syncRoute()
	},
	methods: {
		handleLogin() {
			if (!this.username.trim()) {
				uni.showToast({ title: '请输入用户名', icon: 'none' })
				return
			}

			auth.login()
			uni.showToast({ title: '登录成功', icon: 'success' })

			setTimeout(() => {
				if (this.redirectUrl) {
					router.replace(this.redirectUrl).catch(() => {
						uni.switchTab({ url: '/pages/index/index' })
					})
				} else {
					router.back()
				}
			}, 500)
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

.hint {
	font-size: 22rpx;
	color: #bbb;
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

.form-item {
	margin-bottom: 24rpx;
}

.form-label {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
}

.form-input {
	width: 100%;
	height: 80rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.btn {
	background: #007aff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	text-align: center;
}

.btn-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
}
</style>
