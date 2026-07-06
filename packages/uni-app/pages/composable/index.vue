<template>
	<view class="content">
		<view class="card">
			<text class="card-title">组合式 API - useRouter / useRoute</text>
			<text class="desc">本页使用 Vue 3 &lt;script setup&gt; 语法，演示 useRouter() 和 useRoute() 的用法。与 Options API 的 this.$router / this.$route 等价，但提供更好的类型推导和 Composition API 支持。</text>
		</view>

		<!-- useRoute() 演示 -->
		<view class="card">
			<text class="card-title">useRoute() - 响应式路由位置</text>
			<text class="hint">useRoute() 返回 Ref&lt;RouteLocation&gt;，路由变化时自动更新组件</text>
			<view class="info-row">
				<text class="info-label">path</text>
				<text class="info-value">{{ route.path }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">name</text>
				<text class="info-value">{{ route.name || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">meta.title</text>
				<text class="info-value">{{ route.meta?.title || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">fullPath</text>
				<text class="info-value">{{ route.fullPath }}</text>
			</view>
			<view class="info-row" v-if="Object.keys(route.query).length">
				<text class="info-label">query</text>
				<text class="info-value">{{ JSON.stringify(route.query) }}</text>
			</view>
		</view>

		<!-- useRouter() 演示 -->
		<view class="card">
			<text class="card-title">useRouter() - 路由器实例</text>
			<text class="hint">useRouter() 返回路由器实例，可调用 push / replace / back 等方法</text>
			<view class="btn" @click="pushByPath">
				<text class="btn-text">push (路径字符串)</text>
			</view>
			<view class="btn" @click="pushByName">
				<text class="btn-text">push (命名路由)</text>
			</view>
			<view class="btn btn-secondary" @click="pushWithQuery">
				<text class="btn-text-secondary">push (带 query 参数)</text>
			</view>
			<view class="btn btn-secondary" @click="replacePage">
				<text class="btn-text-secondary">replace 替换当前页</text>
			</view>
			<view class="btn btn-secondary" @click="goBack">
				<text class="btn-text-secondary">back 返回上一页</text>
			</view>
		</view>

		<!-- 响应式更新演示 -->
		<view class="card">
			<text class="card-title">响应式更新演示</text>
			<text class="hint">点击下方按钮导航到带不同 query 的本页，观察上方路由信息自动更新（无需手动调用 syncRoute）</text>
			<view class="btn" @click="refreshWithQuery">
				<text class="btn-text">push 到本页并带新 query</text>
			</view>
			<view class="info-row" v-if="lastError">
				<text class="info-label">错误</text>
				<text class="info-value error">{{ lastError }}</text>
			</view>
		</view>

		<!-- RouterLink + 组合式 API -->
		<view class="card">
			<text class="card-title">RouterLink 组件</text>
			<text class="hint">声明式导航，内部也使用 useRouter() 实现导航</text>
			<mxuni-router to="/pages/index/index" relaunch>
				<view class="btn btn-secondary">
					<text class="btn-text-secondary">RouterLink - relaunch 回首页</text>
				</view>
			</mxuni-router>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute } from '../../uni_modules/mxuni-router/js_sdk/index.js'
import router from '../../router'

// 使用组合式 API 获取路由器和路由位置
const routerInstance = useRouter()
const route = useRoute()

const lastError = ref('')

// syncRoute() 已由路由器全局 mixin 在 onShow 自动调用，无需手动调用
// onShow 仅在需要 onLoad 之前的生命周期读取路由信息时手动调用 syncRoute()
onShow(() => {
	console.log('[composable onShow] 当前路由:', router.currentRoute.fullPath)
})

// ===== useRouter() 导航方法演示 =====
async function pushByPath() {
	try {
		lastError.value = ''
		await routerInstance.push('/pages/about/index')
	} catch (e) {
		lastError.value = e.message || String(e)
	}
}

async function pushByName() {
	try {
		lastError.value = ''
		await routerInstance.push({ name: 'pagesAboutIndex' })
	} catch (e) {
		lastError.value = e.message || String(e)
	}
}

async function pushWithQuery() {
	try {
		lastError.value = ''
		await routerInstance.push({ path: '/pages/about/index', query: { from: 'composable', t: Date.now().toString() } })
	} catch (e) {
		lastError.value = e.message || String(e)
	}
}

async function replacePage() {
	try {
		lastError.value = ''
		await routerInstance.replace('/pages/about/index')
	} catch (e) {
		lastError.value = e.message || String(e)
	}
}

async function goBack() {
	try {
		lastError.value = ''
		await routerInstance.back()
	} catch (e) {
		lastError.value = e.message || String(e)
	}
}

// 重复导航会触发 NAVIGATION_DUPLICATED 错误
async function refreshWithQuery() {
	try {
		lastError.value = ''
		await routerInstance.push({
			path: '/pages/composable/index',
			query: { t: Date.now().toString() }
		})
	} catch (e) {
		// 重复导航到当前页面会抛出 NAVIGATION_DUPLICATED
		lastError.value = e.message || String(e)
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

.info-value.error {
	color: #ff4d4f;
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
