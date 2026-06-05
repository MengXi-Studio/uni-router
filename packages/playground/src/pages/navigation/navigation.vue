<template>
	<view class="container">
		<view class="section">
			<view class="section-title">router.push() - 导航到新页面</view>
			<view class="info-text">对应 uni.navigateTo，将新页面压入页面栈</view>
			<view class="btn" @click="pushByPath">push - 路径字符串</view>
			<view class="btn btn-success" @click="pushByPathObj">push - 路径对象</view>
			<view class="btn btn-warn" @click="pushByNameObj">push - 命名路由对象</view>
			<view class="code-block">
				// 路径字符串\nrouter.push('/pages/detail/detail')\n\n// 路径对象\nrouter.push({ path: '/pages/detail/detail', query: { id: '1' } })\n\n// 命名路由对象\nrouter.push({ name: 'pagesDetailDetail', query: { id: '2' }
				})
			</view>
		</view>

		<view class="section">
			<view class="section-title">router.replace() - 替换当前页面</view>
			<view class="info-text">对应 uni.redirectTo，关闭当前页面再跳转</view>
			<view class="btn btn-warn" @click="replaceByPath">replace - 路径字符串</view>
			<view class="btn btn-danger" @click="replaceByName">replace - 命名路由</view>
			<view class="code-block"> router.replace('/pages/about/about')\nrouter.replace({ name: 'pagesAboutAbout' }) </view>
		</view>

		<view class="section">
			<view class="section-title">router.back() - 返回上一页</view>
			<view class="info-text">对应 uni.navigateBack，可指定返回层级</view>
			<view class="btn btn-gray" @click="goBack">返回上一页 (delta=1)</view>
			<view class="code-block"> router.back() // 默认返回1层\nrouter.back(2) // 返回2层 </view>
		</view>

		<view class="section">
			<view class="section-title">TabBar 页面导航</view>
			<view class="info-text">TabBar 页面使用 push/replace 均会自动调用 switchTab</view>
			<view class="btn btn-success" @click="goTabBar">跳转到关于页 (TabBar)</view>
		</view>

		<view class="section">
			<view class="section-title">RouterLink 组件</view>
			<view class="info-text">使用 RouterLink 组件进行声明式导航</view>
			<RouterLink to="/pages/detail/detail" custom>
				<view class="btn">RouterLink - 路径跳转</view>
			</RouterLink>
			<RouterLink :to="{ name: 'pagesDetailDetail', query: { id: 'link' } }" custom>
				<view class="btn btn-warn">RouterLink - 命名路由</view>
			</RouterLink>
			<RouterLink to="/pages/about/about" replace custom>
				<view class="btn btn-danger">RouterLink - replace 模式</view>
			</RouterLink>
		</view>
	</view>
</template>

<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'

const router = useRouter()

function pushByPath() {
	router.push('/pages/detail/detail')
}

function pushByPathObj() {
	router.push({ path: '/pages/detail/detail', query: { id: '1', method: 'path-obj' } })
}

function pushByNameObj() {
	router.push({ name: 'pagesDetailDetail', query: { id: '2', method: 'name-obj' } })
}

function replaceByPath() {
	router.replace('/pages/about/about')
}

function replaceByName() {
	router.replace({ name: 'pagesAboutAbout' })
}

function goBack() {
	router.back()
}

function goTabBar() {
	router.push({ name: 'pagesAboutAbout' })
}
</script>
