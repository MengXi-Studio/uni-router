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
				<text class="guard-desc">全局后置钩子，导航完成后执行（第三参数 failure 在导航失败时传入）</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">beforeEnter</text>
				<text class="guard-desc">路由独享守卫，进入特定路由时触发</text>
			</view>
			<view class="guard-item">
				<text class="guard-name">onBeforeBack</text>
				<text class="guard-desc">全局返回守卫，返回操作时执行，false 阻止返回</text>
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

		<!-- 守卫重定向方式可控 -->
		<view class="card">
			<text class="card-title">守卫重定向</text>
			<text class="desc">在守卫中 return 路由位置可重定向到其他路由。不指定导航方式时沿用触发守卫的原始导航方式。</text>
			<view class="code-block"> router.beforeEach((to, from) => {\n return { path: '/pages/about/index' }\n}) </view>
			<text class="hint">点击下方按钮会临时注册一次性守卫，将 push 到受保护页面的导航重定向到关于页：</text>
			<view class="btn" @click="redirectToAbout">
				<text class="btn-text">守卫重定向到关于页</text>
			</view>
		</view>

		<!-- 可控重定向 -->
		<view class="card">
			<text class="card-title">可控重定向（{ location, mode }）</text>
			<text class="desc">默认重定向沿用触发导航的原始方式。通过返回 { location, mode } 对象可显式指定重定向使用的导航方式（push / replace / relaunch），如避免登录页残留在页面栈中。</text>
			<view class="code-block">
				router.beforeEach((to, from) => {\n if (to.meta.requireAuth && !isLoggedIn) {\n // 显式指定 replace，避免登录页残留在页面栈中\n return { location: { path: '/pages/login/index' }, mode: 'replace' }\n }\n})
			</view>
			<text class="hint">点击下方按钮会临时注册一次性守卫：导航到关于页时用 replace 方式可控重定向到组合式 API 页（实际调用 redirectTo 而非 navigateTo，不会残留在页面栈中）：</text>
			<view class="btn btn-warning" @click="redirectWithMode">
				<text class="btn-text">可控重定向（replace 到组合式 API 页）</text>
			</view>
		</view>

		<!-- beforeEnter 路由独享守卫 -->
		<view class="card">
			<text class="card-title">beforeEnter - 路由独享守卫</text>
			<text class="desc">定义在路由配置上的守卫，仅对该路由生效。本页（guards）已配置 beforeEnter，进入时会输出日志。</text>
			<view class="code-block"> // router.config.ts { path: '/pages/guards/index', name: 'pagesGuardsIndex', beforeEnter: (to, from) => { console.log('[beforeEnter] 路由独享守卫 - guards 页面') } } </view>
			<text class="hint">执行顺序：beforeEach → beforeEnter → beforeResolve → afterEach。点击下方按钮重新进入本页，观察控制台日志。</text>
			<view class="btn" @click="reenterGuards">
				<text class="btn-text">replace 重新进入本页（查看控制台）</text>
			</view>
		</view>

		<!-- onBeforeBack 全局返回守卫 -->
		<view class="card">
			<text class="card-title">onBeforeBack - 全局返回守卫</text>
			<text class="desc"
				>返回操作（App 物理返回键 / 导航栏返回 / uni.navigateBack，H5 浏览器后退 / 后退手势，router.back()）会先执行 onBeforeBack。返回 false 阻止返回，true / undefined 放行，支持异步（Promise）。守卫放行后复用
				beforeEach → beforeResolve 链路。</text
			>
			<view class="btn btn-warning" @click="testBackGuardBlock">
				<text class="btn-text">测试：阻止本次返回</text>
			</view>
			<view class="btn btn-secondary" @click="testBackGuardAllow">
				<text class="btn-text-secondary">测试：放行返回</text>
			</view>
			<text class="hint"
				>提示：App 物理返回键 / 导航栏返回、H5 浏览器后退 / 后退手势也可被 onBeforeBack 拦截；iOS 侧滑返回默认绕过守卫，需配置 app.setSideSlipGesture('none') 禁用手势（本应用已在 router.js
				演示）。小程序原生返回无法拦截。</text
			>
			<view class="code-block"> router.onBeforeBack((to, from) => {\n if (hasUnsavedChanges) {\n return false // 阻止返回\n }\n // true / undefined 放行\n}) </view>
		</view>

		<!-- guardRoute() 冷启动守卫检查 -->
		<view class="card">
			<text class="card-title">guardRoute() - 冷启动守卫检查</text>
			<text class="desc">当用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入页面时，页面由 uni-app 框架直接加载，不经过路由器导航，守卫（beforeEach 等）未执行。guardRoute() 对当前已加载页面补执行守卫链。</text>
			<view class="code-block">
				// App.vue onLaunch 中 router.isReady().then(() => { router.guardRoute(undefined, { onAbort: (failure) => { // 守卫中止，跳转到安全页面 router.relaunch('/pages/index/index') } }) })
			</view>
			<text class="hint">行为：守卫放行→不执行导航；守卫重定向→按指定方式跳转；守卫中止→调用 onAbort 并 reject。</text>
			<view class="btn" @click="testGuardRoute">
				<text class="btn-text">测试：对当前路由执行 guardRoute()</text>
			</view>
			<view class="btn btn-warning" @click="testGuardRouteAbort">
				<text class="btn-text">测试：guardRoute() 被守卫中止</text>
			</view>
			<view v-if="guardRouteLog" class="info-row">
				<text class="info-label">结果</text>
				<text class="info-value">{{ guardRouteLog }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import router from '../../router'

export default {
	data() {
		return {
			logs: [],
			guardRouteLog: ''
		}
	},
	onLoad() {
		this.addLog('进入守卫演示页面')
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
		},
		// ===== 守卫重定向演示 =====
		redirectToAbout() {
			this.addLog('注册一次性守卫，将导航重定向到关于页...')
			const removeGuard = router.beforeEach((to, from) => {
				removeGuard()
				if (to.path === '/pages/protected/index') {
					this.addLog(`守卫拦截 ${to.path}，重定向到关于页`)
					return { path: '/pages/about/index', query: { from: 'redirect-demo' } }
				}
			})
			router.push('/pages/protected/index').catch(e => {
				this.addLog(`导航结果: ${e.message || e}`)
			})
		},
		// ===== 可控重定向演示 =====
		redirectWithMode() {
			this.addLog('注册一次性守卫，用 replace 方式可控重定向到组合式 API 页...')
			const removeGuard = router.beforeEach((to, from) => {
				removeGuard()
				if (to.path === '/pages/about/index') {
					this.addLog(`守卫拦截 ${to.path}，可控重定向（mode: replace）到组合式 API 页`)
					return { location: { path: '/pages/composable/index' }, mode: 'replace' }
				}
			})
			router.push('/pages/about/index').catch(e => {
				this.addLog(`导航结果: ${e.message || e}`)
			})
		},
		// ===== beforeEnter 路由独享守卫演示 =====
		reenterGuards() {
			this.addLog('replace 重新进入本页，触发 beforeEnter')
			router.replace('/pages/guards/index').catch(e => {
				this.addLog(`导航结果: ${e.message || e}`)
			})
		},
		// ===== onBeforeBack 全局返回守卫演示 =====
		testBackGuardBlock() {
			this.addLog('注册一次性返回守卫：阻止返回')
			// 动态注册一次性返回守卫：阻止返回
			const removeGuard = router.onBeforeBack(() => {
				removeGuard()
				this.addLog('返回已被 onBeforeBack 阻止，再返回一次即可退出')
				uni.showToast({ title: '返回已被 onBeforeBack 阻止，再返回一次即可退出', icon: 'none' })
				return false
			})
			// 先跳转到关于页，再调用 router.back() 触发返回守卫（被阻止后停留在关于页）
			router.push('/pages/about/index').then(() => {
				router.back().catch(() => {
					// 返回被守卫阻止（已提示）
				})
			})
		},
		testBackGuardAllow() {
			this.addLog('注册一次性返回守卫：放行返回')
			// 动态注册一次性返回守卫：放行返回
			const removeGuard = router.onBeforeBack((to, from) => {
				removeGuard()
				this.addLog(`onBeforeBack 放行返回: ${from.path} -> ${to.path}`)
				uni.showToast({ title: 'onBeforeBack 放行返回', icon: 'none' })
			})
			// 先跳转到关于页，再返回，返回守卫放行后回到本页
			router.push('/pages/about/index').then(() => {
				router.back().catch(() => {})
			})
		},
		// ===== guardRoute() 冷启动守卫检查演示 =====
		testGuardRoute() {
			this.guardRouteLog = ''
			this.addLog('对当前路由执行 guardRoute()...')
			router
				.guardRoute()
				.then(route => {
					this.guardRouteLog = `守卫放行，当前路由: ${route.fullPath}`
					this.addLog(this.guardRouteLog)
					uni.showToast({ title: '守卫检查通过', icon: 'none' })
				})
				.catch(() => {})
		},
		testGuardRouteAbort() {
			this.guardRouteLog = ''
			this.addLog('注册一次性守卫返回 false，再执行 guardRoute()...')
			// 临时注册一个返回 false 的守卫（中止导航）
			const removeGuard = router.beforeEach(() => {
				removeGuard()
				return false
			})
			router
				.guardRoute(undefined, {
					onAbort: failure => {
						this.guardRouteLog = `守卫中止: ${failure.code}`
						this.addLog(this.guardRouteLog)
						uni.showToast({ title: `guardRoute 被中止: ${failure.code}`, icon: 'none' })
					}
				})
				.catch(() => {})
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

.code-block {
	background: #1e1e1e;
	border-radius: 12rpx;
	padding: 20rpx;
	margin: 16rpx 0;
	white-space: pre-wrap;
	word-break: break-all;
	color: #0f0;
	font-size: 22rpx;
	font-family: monospace;
}
</style>
