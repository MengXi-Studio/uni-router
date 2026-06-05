<template>
	<view class="container">
		<view class="section">
			<view class="section-title">登录页</view>
			<view class="info-text">此页面是路由守卫重定向的目标页面。当未登录用户访问 requireAuth 页面时，beforeEach 守卫会将导航重定向到此处。</view>
			<view v-if="redirectUrl" class="info-text" style="color: #ff9500"> 登录后将返回: {{ redirectUrl }} </view>
		</view>

		<view class="section">
			<view class="section-title">守卫重定向逻辑</view>
			<view class="code-block">
				router.beforeEach((to, from, next) => {\n if (to.meta.requireAuth && !isLoggedIn) {\n // 重定向到登录页，携带原始目标路径\n next({\n name: 'pagesLoginLogin',\n query: { redirect: to.fullPath }\n })\n } else {\n
				next()\n }\n})
			</view>
		</view>

		<view class="btn btn-success" @click="handleLogin">模拟登录并跳转</view>
		<view class="btn btn-gray" @click="goBack">返回上一页</view>
	</view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'
import { useAuth } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const { setLoggedIn } = useAuth()

const redirectUrl = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect || ''

function handleLogin() {
	setLoggedIn(true)
	uni.showToast({ title: '登录成功', icon: 'success' })
	if (redirectUrl) {
		setTimeout(() => {
			router.replace(redirectUrl)
		}, 500)
	} else {
		setTimeout(() => {
			router.back()
		}, 500)
	}
}

function goBack() {
	router.back()
}
</script>
