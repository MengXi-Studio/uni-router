<template>
	<view class="content">
		<view class="card">
			<text class="card-title">错误处理演示</text>
			<text class="desc">演示 uni-router 的 RouterError / NavigationFailure 错误体系和 onError 全局捕获。</text>
		</view>

		<!-- 错误码说明 -->
		<view class="card">
			<text class="card-title">RouterErrorCode 错误码</text>
			<view class="guard-item">
				<text class="guard-name">NAVIGATION_ABORTED</text>
				<text class="guard-desc">导航被守卫中止（守卫调用 next(false)）</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">NAVIGATION_CANCELLED</text>
				<text class="guard-desc">导航被取消（守卫超时 / 抛出异常 / 重定向超限 / back() 栈不足）</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">NAVIGATION_DUPLICATED</text>
				<text class="guard-desc">重复导航到当前位置</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">ROUTE_NOT_FOUND</text>
				<text class="guard-desc">未找到匹配的路由</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">NAVIGATION_API_ERROR</text>
				<text class="guard-desc">uni 导航 API 调用失败，cause 携带失败的 API 信息</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">SETUP_ERROR</text>
				<text class="guard-desc">路由器初始化或使用方式错误</text>
			</view>
		</view>

		<!-- NAVIGATION_DUPLICATED -->
		<view class="card">
			<text class="card-title">NAVIGATION_DUPLICATED - 重复导航</text>
			<text class="hint">push 到当前已位于的页面时抛出</text>
			<view class="btn" @click="testDuplicate">
				<text class="btn-text">push 到当前页面（错误页）</text>
			</view>
		</view>

		<!-- ROUTE_NOT_FOUND -->
		<view class="card">
			<text class="card-title">ROUTE_NOT_FOUND - 路由未找到</text>
			<text class="hint">导航到未在 routes 中声明的路径时抛出（strict: true 时）</text>
			<view class="btn btn-warning" @click="testNotFound">
				<text class="btn-text">push 到不存在的路由</text>
			</view>
		</view>

		<!-- NAVIGATION_ABORTED -->
		<view class="card">
			<text class="card-title">NAVIGATION_ABORTED - 守卫中止</text>
			<text class="hint">守卫调用 next(false) 中止导航时抛出</text>
			<view class="btn btn-warning" @click="testAborted">
				<text class="btn-text">注册一次性 next(false) 守卫后导航</text>
			</view>
		</view>

		<!-- NAVIGATION_CANCELLED -->
		<view class="card">
			<text class="card-title">NAVIGATION_CANCELLED - 导航被取消</text>
			<text class="hint">守卫超时未调用 next()、守卫抛出异常、或 back() 页面栈不足时抛出</text>
			<view class="btn btn-warning" @click="testCancelledTimeout">
				<text class="btn-text">测试：守卫超时</text>
			</view>
			<view class="btn btn-warning" @click="testCancelledException">
				<text class="btn-text">测试：守卫抛出异常</text>
			</view>
			<view class="btn btn-secondary" @click="testCancelledBackStack">
				<text class="btn-text-secondary">测试：back() 栈不足</text>
			</view>
		</view>

		<!-- NAVIGATION_API_ERROR -->
		<view class="card">
			<text class="card-title">NAVIGATION_API_ERROR - uni API 调用失败</text>
			<text class="hint">uni.navigateTo 等原生 API 调用失败时抛出，cause 携带失败的 API 信息（UniApiError）</text>
			<view class="btn btn-warning" @click="testApiError">
				<text class="btn-text">测试：模拟 uni.navigateTo 失败</text>
			</view>
			<view v-if="apiErrorLog" class="code-block">{{ apiErrorLog }}</view>
		</view>

		<!-- 错误日志 -->
		<view class="card">
			<text class="card-title">错误日志</text>
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
import { NavigationFailure, RouterErrorCode } from '../../uni_modules/mxuni-router-v2/js_sdk/index.js'

export default {
	data() {
		return {
			logs: [],
			apiErrorLog: ''
		}
	},
	methods: {
		addLog(msg) {
			const time = new Date().toLocaleTimeString()
			this.logs.unshift(`[${time}] ${msg}`)
			if (this.logs.length > 20) this.logs.pop()
		},
		// ===== NAVIGATION_DUPLICATED =====
		async testDuplicate() {
			this.addLog('push 到当前页面（错误页）...')
			try {
				await router.push('/pages/error/index')
			} catch (e) {
				this.checkError(e, 'NAVIGATION_DUPLICATED')
			}
		},
		// ===== ROUTE_NOT_FOUND =====
		async testNotFound() {
			this.addLog('push 到不存在的路由...')
			try {
				await router.push('/pages/not-exist/index')
			} catch (e) {
				this.checkError(e, 'ROUTE_NOT_FOUND')
			}
		},
		// ===== NAVIGATION_ABORTED =====
		async testAborted() {
			this.addLog('注册一次性 next(false) 守卫后导航...')
			const removeGuard = router.beforeEach((_to, _from, next) => {
				next(false)
				removeGuard()
			})
			try {
				await router.push('/pages/about/index')
			} catch (e) {
				this.checkError(e, 'NAVIGATION_ABORTED')
			}
		},
		// ===== NAVIGATION_CANCELLED - 守卫超时 =====
		async testCancelledTimeout() {
			this.addLog('注册不调用 next() 的守卫，等待 guardTimeout 超时...')
			const removeGuard = router.beforeEach(() => {
				// 不调用 next()，触发超时
			})
			try {
				// 此处无法直接缩短 guardTimeout，依赖 router.js 中配置的 15s
				await router.push('/pages/about/index')
			} catch (e) {
				this.checkError(e, 'NAVIGATION_CANCELLED')
			} finally {
				removeGuard()
			}
		},
		// ===== NAVIGATION_CANCELLED - 守卫抛出异常 =====
		async testCancelledException() {
			this.addLog('注册抛出异常的守卫...')
			const removeGuard = router.beforeEach(() => {
				throw new Error('守卫主动抛出异常')
			})
			try {
				await router.push('/pages/about/index')
			} catch (e) {
				this.checkError(e, 'NAVIGATION_CANCELLED')
			} finally {
				removeGuard()
			}
		},
		// ===== NAVIGATION_CANCELLED - back() 栈不足 =====
		async testCancelledBackStack() {
			this.addLog('back(99) 尝试返回超过页面栈深度...')
			try {
				await router.back(99)
			} catch (e) {
				this.checkError(e, 'NAVIGATION_CANCELLED')
			}
		},
		// ===== NAVIGATION_API_ERROR =====
		async testApiError() {
			this.apiErrorLog = ''
			this.addLog('模拟 uni.navigateTo 调用失败...')
			const originalNavigateTo = uni.navigateTo
			uni.navigateTo = function (options) {
				// 恢复原始方法
				uni.navigateTo = originalNavigateTo
				if (options && options.fail) {
					options.fail({ errMsg: 'navigateTo:fail mock api error' })
				}
			}
			try {
				await router.push('/pages/about/index')
			} catch (e) {
				if (e instanceof NavigationFailure && e.code === RouterErrorCode.NAVIGATION_API_ERROR) {
					const cause = e.cause
					this.apiErrorLog = `code: ${e.code}\napi: ${cause?.api}\nerrMsg: ${cause?.cause?.errMsg}`
					this.addLog(`捕获 API 错误 - api: ${cause?.api}, errMsg: ${cause?.cause?.errMsg}`)
					uni.showToast({ title: '捕获 API 错误', icon: 'none' })
				} else {
					this.checkError(e)
				}
			} finally {
				uni.navigateTo = originalNavigateTo
			}
		},
		// ===== 错误类型判断 =====
		checkError(error, expectedCode) {
			if (error instanceof NavigationFailure) {
				const msg = `NavigationFailure - code: ${error.code}, to: ${error.to?.fullPath}`
				this.addLog(msg)
				if (expectedCode && error.code === expectedCode) {
					uni.showToast({ title: `捕获 ${error.code}`, icon: 'none' })
				}
			} else {
				this.addLog(`Error: ${error.message || String(error)}`)
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
	margin-bottom: 20rpx;
}

.guard-item {
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.guard-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.guard-desc {
	font-size: 22rpx;
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

.code-block {
	background: #1e1e1e;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 16rpx;
	white-space: pre-wrap;
	word-break: break-all;
	color: #0f0;
	font-size: 22rpx;
	font-family: monospace;
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
