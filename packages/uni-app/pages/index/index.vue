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
			<text class="hint">使用 router.push / replace / relaunch / back 进行导航</text>
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
			<view class="btn btn-secondary" @click="relaunchPage">
				<text class="btn-text-secondary">relaunch 关闭所有页面并跳转</text>
			</view>
		</view>

		<!-- RouterLink 组件 -->
		<view class="card">
			<text class="card-title">RouterLink 组件</text>
			<text class="hint">使用 mxuni-router 组件进行声明式导航</text>
			<mxuni-router to="/pages/about/index">
				<view class="btn">
					<text class="btn-text">RouterLink - 路径跳转</text>
				</view>
			</mxuni-router>
			<mxuni-router to="/pages/guards/index" replace>
				<view class="btn btn-secondary">
					<text class="btn-text-secondary">RouterLink - replace 模式</text>
				</view>
			</mxuni-router>
			<mxuni-router to="/pages/index/index" relaunch>
				<view class="btn btn-secondary">
					<text class="btn-text-secondary">RouterLink - relaunch 模式</text>
				</view>
			</mxuni-router>
		</view>

		<!-- RouterLink animation -->
		<view class="card">
			<text class="card-title">RouterLink - animation 属性</text>
			<text class="hint">通过 animation 属性控制导航动画（仅 App 端生效）</text>
			<mxuni-router to="/pages/about/index" :animation="{ type: 'slide-in-bottom' }">
				<view class="btn">
					<text class="btn-text">RouterLink - 底部滑入动画</text>
				</view>
			</mxuni-router>
		</view>

		<!-- RouterLink params/persistent -->
		<view class="card">
			<text class="card-title">RouterLink - params 与 persistent</text>
			<text class="hint">通过 params 属性传递复杂数据，通过 persistent 属性控制是否持久化到 storage</text>
			<mxuni-router :to="{ path: '/pages/about/index', query: { id: 'link-params' } }" :params="{ orderInfo: { orderId: 'A001', amount: 99.9 } }">
				<view class="btn">
					<text class="btn-text">RouterLink - 带 params 跳转</text>
				</view>
			</mxuni-router>
			<mxuni-router :to="{ path: '/pages/about/index', query: { id: 'link-persistent' } }" :params="{ config: { theme: 'dark' } }" persistent>
				<view class="btn btn-secondary">
					<text class="btn-text-secondary">RouterLink - params 持久化</text>
				</view>
			</mxuni-router>
		</view>

		<!-- RouterLink events + navigated -->
		<view class="card">
			<text class="card-title">RouterLink - events 与 navigated</text>
			<text class="hint">通过 events 属性监听目标页面事件，通过 @navigated 获取 eventChannel</text>
			<mxuni-router :to="{ path: '/pages/about/index', query: { id: 'link-ec' } }" :events="{ receiveData: data => onReceiveData(data) }" @navigated="onNavigated" @error="onRouterLinkError">
				<view class="btn btn-secondary">
					<text class="btn-text-secondary">RouterLink - events + navigated</text>
				</view>
			</mxuni-router>
			<view v-if="routerLinkLog" class="info-row">
				<text class="info-value active">{{ routerLinkLog }}</text>
			</view>
		</view>

		<!-- 导航动画 -->
		<view class="card">
			<text class="card-title">导航动画（仅 App 端生效）</text>
			<text class="hint">通过 animation 参数控制页面切换动画</text>
			<view class="btn" @click="pushWithAnimation">
				<text class="btn-text">push - 底部滑入动画</text>
			</view>
			<view class="btn btn-secondary" @click="backWithAnimation">
				<text class="btn-text-secondary">back - 左侧滑出动画</text>
			</view>
		</view>

		<!-- params 参数传递 -->
		<view class="card">
			<text class="card-title">params - 页面参数传递</text>
			<text class="hint">params 支持传递复杂数据（对象、数组等），不暴露在 URL 中，目标页面通过 route.params 读取</text>
			<view class="btn" @click="pushWithParams">
				<text class="btn-text">push - 带 params 跳转</text>
			</view>
			<view class="btn btn-secondary" @click="pushWithParamsPersistent">
				<text class="btn-text-secondary">push - params 持久化存储</text>
			</view>
		</view>

		<!-- 查询参数增强 -->
		<view class="card">
			<text class="card-title">查询参数增强 - queryInt / queryNumber / queryBool</text>
			<text class="hint">RouteLocation 提供三个便捷方法，自动解析 query 参数为指定类型</text>
			<view class="btn" @click="pushWithNumericQuery">
				<text class="btn-text">push - 数值类型查询参数</text>
			</view>
			<view class="btn btn-secondary" @click="pushWithBoolQuery">
				<text class="btn-text-secondary">push - 布尔类型查询参数</text>
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

		<!-- EventChannel -->
		<view class="card">
			<text class="card-title">EventChannel - 页面间通信</text>
			<text class="hint">push 支持 events 参数和 eventChannel 返回值，实现页面间双向通信</text>
			<view class="btn" @click="goToEventChannel">
				<text class="btn-text">查看 EventChannel 演示</text>
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
			<view class="info-row">
				<text class="info-label">params</text>
				<text class="info-value">{{ paramsStr }}</text>
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
			<text class="hint">完整的 RouterError / NavigationFailure 错误体系演示</text>
			<view class="btn" @click="goToError">
				<text class="btn-text">查看错误处理演示</text>
			</view>
			<view class="btn btn-warning" @click="goToNotFound">
				<text class="btn-text">快速测试：导航到不存在的路由</text>
			</view>
			<view class="btn btn-warning" @click="goToDuplicate">
				<text class="btn-text">快速测试：重复导航当前页面</text>
			</view>
			<view v-if="lastError" class="error-box">
				<text class="error-text">{{ lastError }}</text>
			</view>
		</view>

		<!-- 路由解析 -->
		<view class="card">
			<text class="card-title">路由解析</text>
			<text class="hint">resolve / hasRoute / getRoutes</text>
			<view class="btn" @click="testResolve">
				<text class="btn-text">resolve 解析路由</text>
			</view>
			<view class="btn btn-secondary" @click="testHasRoute">
				<text class="btn-text-secondary">hasRoute 检查路由</text>
			</view>
			<view class="btn btn-secondary" @click="testGetRoutes">
				<text class="btn-text-secondary">getRoutes 获取路由列表</text>
			</view>
			<view v-if="resolveResult" class="error-box">
				<text class="error-text">{{ resolveResult }}</text>
			</view>
		</view>

		<!-- interceptUniApi 拦截演示 -->
		<view class="card">
			<text class="card-title">interceptUniApi - 拦截 uni 原生导航 API</text>
			<text class="hint">启用 interceptUniApi 后，直接调用 uni.navigateTo 等将被拦截，自动转为 router.push / replace / relaunch / back，确保守卫始终生效</text>
			<view class="btn" @click="interceptedNavigateTo">
				<text class="btn-text">uni.navigateTo（被拦截转为 push）</text>
			</view>
			<view class="btn btn-secondary" @click="interceptedRedirectTo">
				<text class="btn-text-secondary">uni.redirectTo（被拦截转为 replace）</text>
			</view>
			<view class="btn btn-secondary" @click="interceptedReLaunch">
				<text class="btn-text-secondary">uni.reLaunch（被拦截转为 relaunch）</text>
			</view>
			<view class="btn btn-secondary" @click="interceptedNavigateBack">
				<text class="btn-text-secondary">uni.navigateBack（被拦截转为 back）</text>
			</view>
			<view class="warn-tip">
				⚠️ 关于 uni.switchTab：本项目未配置 TabBar，故未提供演示。switchTab 同样会被拦截转为 router.push（TabBar 页面自动使用 switchTab 导航）。注意 H5 平台对 switchTab 有特殊处理（放行原始调用 + success
				回调同步状态），详见官方文档。
			</view>
		</view>

		<!-- 组合式 API -->
		<view class="card">
			<text class="card-title">组合式 API（useRouter / useRoute）</text>
			<text class="hint">在 Vue 3 setup 中使用 useRouter() 和 useRoute() 访问路由器</text>
			<view class="btn" @click="goToComposable">
				<text class="btn-text">查看组合式 API 演示</text>
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
			lastError: '',
			resolveResult: '',
			routerLinkLog: ''
		}
	},
	computed: {
		paramsStr() {
			const p = this.currentRoute.params
			if (!p || !Object.keys(p).length) return '{}'
			return JSON.stringify(p)
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
				fullPath: route.fullPath || '',
				params: route.params || {}
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
		async relaunchPage() {
			try {
				await router.relaunch('/pages/about/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async pushWithAnimation() {
			try {
				await router.push({ path: '/pages/about/index', query: { from: 'anim' }, animation: { type: 'slide-in-bottom' } })
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async backWithAnimation() {
			try {
				await router.back(1, { type: 'slide-out-left', duration: 500 })
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
		async goToError() {
			try {
				this.lastError = ''
				await router.push('/pages/error/index')
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
		},
		testResolve() {
			const resolved = router.resolve({ path: '/pages/about/index', query: { from: 'resolve' } })
			this.resolveResult = `path: ${resolved.path}\nname: ${resolved.name || '-'}\nfullPath: ${resolved.fullPath}`
		},
		testHasRoute() {
			const exists = router.hasRoute('pagesAboutIndex')
			const notExists = router.hasRoute('nonExistent')
			this.resolveResult = `hasRoute('pagesAboutIndex'): ${exists}\nhasRoute('nonExistent'): ${notExists}`
		},
		testGetRoutes() {
			const routes = router.getRoutes()
			const names = routes.map(r => r.name || r.path).join(', ')
			this.resolveResult = `共 ${routes.length} 条路由:\n${names}`
		},
		async goToEventChannel() {
			try {
				await router.push('/pages/event-channel/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		onReceiveData(data) {
			this.routerLinkLog = `收到关于页数据: ${JSON.stringify(data)}`
			uni.showToast({ title: `收到: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
		},
		onNavigated(eventChannel) {
			if (eventChannel) {
				eventChannel.emit('fromOpener', { msg: '来自 RouterLink 的 navigated 事件' })
				this.routerLinkLog = '已通过 eventChannel 发送消息到关于页'
			}
		},
		onRouterLinkError(error) {
			this.lastError = `RouterLink 导航失败: ${error.message || String(error)}`
		},
		// ===== interceptUniApi 拦截演示 =====
		// 启用 interceptUniApi: true 后，直接调用 uni 原生导航 API 会被拦截并转为路由器方法
		interceptedNavigateTo() {
			// 会被拦截，自动转为 router.push({ path: '/pages/about/index', query: { id: 'intercepted' } })
			uni.navigateTo({ url: '/pages/about/index?id=intercepted' })
		},
		interceptedRedirectTo() {
			// 会被拦截，自动转为 router.replace('/pages/about/index')
			uni.redirectTo({ url: '/pages/about/index' })
		},
		interceptedReLaunch() {
			// 会被拦截，自动转为 router.relaunch('/pages/index/index')
			uni.reLaunch({ url: '/pages/index/index' })
		},
		interceptedNavigateBack() {
			// 会被拦截，自动转为 router.back(1)，执行完整守卫链
			uni.navigateBack({ delta: 1 })
		},
		// ===== params 参数传递演示 =====
		async pushWithParams() {
			try {
				this.lastError = ''
				await router.push({
					path: '/pages/about/index',
					query: { id: 'params-demo' },
					params: { userInfo: { name: 'Tom', age: 20 }, tags: ['vip', 'active'] }
				})
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async pushWithParamsPersistent() {
			try {
				this.lastError = ''
				await router.push({
					path: '/pages/about/index',
					query: { id: 'persistent-demo' },
					params: { bigData: { items: [1, 2, 3], total: 3 } },
					persistent: true
				})
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		// ===== 查询参数增强演示 =====
		async pushWithNumericQuery() {
			try {
				this.lastError = ''
				await router.push({
					path: '/pages/about/index',
					query: { id: 'numeric', price: 19.99, count: 5 }
				})
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		async pushWithBoolQuery() {
			try {
				this.lastError = ''
				await router.push({
					path: '/pages/about/index',
					query: { id: 'bool', enabled: true, visible: false }
				})
			} catch (e) {
				this.lastError = e.message || String(e)
			}
		},
		// ===== 组合式 API 演示页面跳转 =====
		async goToComposable() {
			try {
				await router.push('/pages/composable/index')
			} catch (e) {
				this.lastError = e.message || String(e)
			}
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

.warn-tip {
	background: #fff7e6;
	border: 2rpx solid #ffd591;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 20rpx;
	font-size: 22rpx;
	color: #ff9500;
	line-height: 1.6;
}
</style>
