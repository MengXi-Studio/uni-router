<template>
	<view class="container">
		<view class="section">
			<view class="section-title">uni-router 功能演示</view>
			<view class="info-text">
				本应用演示了
				<text style="color: #007aff; font-weight: 600">@meng-xi/uni-router</text>
				的所有核心功能，路由配置由
				<text style="color: #007aff; font-weight: 600">@meng-xi/vite-plugin</text>
				的 generateRouter 插件自动生成。
			</view>
			<view class="info-text" style="margin-top: 16rpx">
				<text class="tag tag-blue">push / replace</text>
				<text class="tag tag-green">路由守卫</text>
				<text class="tag tag-orange">命名路由</text>
				<text class="tag tag-red">错误处理</text>
				<text class="tag tag-purple">EventChannel</text>
			</view>
		</view>

		<view class="section">
			<view class="section-title">路由导航</view>
			<view class="btn" @click="goNavigation">查看导航示例</view>
			<view class="btn btn-success" @click="goDetail">push 带参数跳转详情</view>
			<view class="btn btn-warn" @click="goDetailByName">命名路由跳转详情</view>
		</view>

		<view class="section">
			<view class="section-title">路由守卫</view>
			<view class="btn btn-warn" @click="goGuards">查看守卫示例</view>
			<view class="btn btn-danger" @click="goProtected">访问受保护页面</view>
			<view class="info-text" style="margin-top: 8rpx">
				当前登录状态：
				<text :style="{ color: isLoggedIn ? '#34c759' : '#ff3b30' }">{{ isLoggedIn ? '已登录' : '未登录' }}</text>
			</view>
			<view class="btn" :class="isLoggedIn ? 'btn-gray' : 'btn-success'" @click="toggleLoginStatus">
				{{ isLoggedIn ? '退出登录' : '模拟登录' }}
			</view>
		</view>

		<view class="section">
			<view class="section-title">路由解析与错误处理</view>
			<view class="btn" @click="goResolve">路由解析 resolve()</view>
			<view class="btn btn-danger" @click="goError">错误处理示例</view>
		</view>

		<view class="section">
			<view class="section-title">分包页面</view>
			<view class="btn btn-success" @click="goProfile">个人中心（分包）</view>
			<view class="btn btn-warn" @click="goSettings">设置（需登录-分包）</view>
		</view>

		<view class="section">
			<view class="section-title">当前路由信息</view>
			<view class="code-block">
				path: {{ currentRoute.path }}\nname: {{ currentRoute.name || '-' }}\nfullPath: {{ currentRoute.fullPath }}\nmeta.title: {{ currentRoute.meta.title || '-' }}\nmeta.isTab:
				{{ currentRoute.meta.isTab ?? '-' }}\nmeta.requireAuth: {{ currentRoute.meta.requireAuth ?? '-' }}
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'
import { useAuth } from '@/utils/auth'

const router = useRouter()
const currentRoute = useRoute()
const { isLoggedIn, toggleLogin } = useAuth()

function goNavigation() {
	router.push({ name: 'pagesNavigationNavigation' })
}

function goDetail() {
	router.push({
		path: '/pages/detail/detail',
		query: { id: '42', from: 'index', ts: Date.now().toString() }
	})
}

function goDetailByName() {
	router.push({
		name: 'pagesDetailDetail',
		query: { id: '99', source: 'named-route' }
	})
}

function goGuards() {
	router.push({ name: 'pagesGuardsGuards' })
}

function goProtected() {
	router.push({ name: 'pagesProtectedProtected' })
}

function toggleLoginStatus() {
	toggleLogin()
	uni.showToast({ title: isLoggedIn.value ? '已登录' : '已退出', icon: 'none' })
}

function goResolve() {
	router.push({ name: 'pagesResolveResolve' })
}

function goError() {
	router.push({ name: 'pagesErrorError' })
}

function goProfile() {
	router.push({ name: 'pagesSubProfileProfile' })
}

function goSettings() {
	router.push({ name: 'pagesSubSettingsSettings' })
}
</script>
