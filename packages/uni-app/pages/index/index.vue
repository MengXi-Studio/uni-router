<template>
	<view class="content">
		<view class="header">
			<image class="logo" src="/static/logo.png"></image>
			<text class="title">Uni Router Demo</text>
			<text class="subtitle">@meng-xi/uni-router 路由管理功能演示</text>
		</view>

		<!-- 路由导航 -->
		<view class="card">
			<text class="card-title">路由导航</text>
			<text class="hint">使用 router.push / replace / back 进行导航</text>
			<view class="btn" @click="pushByPath">
				<text class="btn-text">push (路径)</text>
			</view>
			<view class="btn" @click="pushByName">
				<text class="btn-text">push (命名路由)</text>
			</view>
			<view class="btn" @click="pushWithQuery">
				<text class="btn-text">push (带查询参数)</text>
			</view>
			<view class="btn btn-secondary" @click="replacePage">
				<text class="btn-text-secondary">replace 替换当前页</text>
			</view>
		</view>

		<!-- 路由守卫 -->
		<view class="card">
			<text class="card-title">路由守卫</text>
			<text class="hint">beforeEach 守卫拦截未登录访问受保护页面</text>
			<view class="btn" @click="goToProtected">
				<text class="btn-text">访问受保护页面</text>
			</view>
			<view class="btn btn-secondary" @click="goToGuards">
				<text class="btn-text-secondary">守卫演示页面</text>
			</view>
			<view class="info-row">
				<text class="info-label">登录状态</text>
				<text :class="['info-value', loginStatus ? 'active' : 'inactive']">
					{{ loginStatus ? '已登录' : '未登录' }}
				</text>
			</view>
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
			<view class="info-row">
				<text class="info-label">meta.requireAuth</text>
				<text class="info-value">{{ currentRoute.meta?.requireAuth ? '是' : '否' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">fullPath</text>
				<text class="info-value">{{ currentRoute.fullPath || '-' }}</text>
			</view>
		</view>

		<!-- 登录状态管理 -->
		<view class="card">
			<text class="card-title">登录状态管理</text>
			<text class="hint">模拟登录/退出，配合守卫验证权限控制</text>
			<view class="btn-group">
				<view class="btn btn-sm" @click="doLogin">
					<text class="btn-text">登录</text>
				</view>
				<view class="btn btn-sm btn-secondary" @click="doLogout">
					<text class="btn-text-secondary">退出</text>
				</view>
			</view>
		</view>

		<!-- 错误处理 -->
		<view class="card">
			<text class="card-title">错误处理</text>
			<text class="hint">导航到不存在的路由或重复导航</text>
			<view class="btn btn-warning" @click="goToNotFound">
				<text class="btn-text">导航到不存在的路由</text>
			</view>
			<view class="btn btn-warning" @click="goToDuplicate">
				<text class="btn-text">重复导航当前页面</text>
			</view>
			<view v-if="lastError" class="error-box">
				<text class="error-text">{{ lastError }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import router, { auth } from '../../router'

export default {
	data() {
		return {
			loginStatus: false,
			currentRoute: {},
			lastError: ''
		}
	},
	onLoad() {
		this.updateRouteInfo()
		this.updateLoginStatus()
	},
	onShow() {
		router.syncRoute()
		this.updateRouteInfo()
		this.updateLoginStatus()
	},
	methods: {
		updateRouteInfo() {
			const route = router.currentRoute?.value || router.currentRoute || {}
			this.currentRoute = {
				path: route.path || '',
				name: route.name || '',
				meta: route.meta || {},
				fullPath: route.fullPath || ''
			}
		},
		updateLoginStatus() {
			this.loginStatus = auth.isLoggedIn()
		},
		async pushByPath() {
			try {
				await router.push('/pages/about/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async pushByName() {
			try {
				await router.push({ name: 'pagesAboutIndex' })
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async pushWithQuery() {
			try {
				await router.push({ path: '/pages/about/index', query: { from: 'home', id: '123' } })
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async replacePage() {
			try {
				await router.replace('/pages/about/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async goToProtected() {
			try {
				await router.push('/pages/protected/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async goToGuards() {
			try {
				await router.push('/pages/guards/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async goToNotFound() {
			try {
				this.lastError = ''
				await router.push('/pages/not-exist/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async goToDuplicate() {
			try {
				this.lastError = ''
				await router.push('/pages/index/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		doLogin() {
			auth.login()
			this.loginStatus = true
		},
		doLogout() {
			auth.logout()
			this.loginStatus = false
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

.header {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 40rpx;
}

.logo {
	height: 200rpx;
	width: 200rpx;
	margin-bottom: 30rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.subtitle {
	font-size: 26rpx;
	color: #999;
	margin-top: 10rpx;
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

.info-value.active {
	color: #07c160;
}

.info-value.inactive {
	color: #ff4d4f;
}

.hint {
	font-size: 22rpx;
	color: #bbb;
	margin-bottom: 20rpx;
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

.btn-sm {
	flex: 1;
	padding: 16rpx;
	margin-top: 0;
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

.btn-group {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
}

.error-box {
	background: #fff2f0;
	border: 2rpx solid #ffccc7;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
}

.error-text {
	font-size: 24rpx;
	color: #ff4d4f;
}
</style>
