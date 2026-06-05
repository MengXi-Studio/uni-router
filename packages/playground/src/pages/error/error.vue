<template>
	<view class="container">
		<view class="section">
			<view class="section-title">错误处理概述</view>
			<view class="info-text">
				uni-router 通过
				<text class="tag tag-red">RouterError</text>
				和
				<text class="tag tag-red">NavigationFailure</text>
				两类错误对象描述路由过程中的异常，可通过 router.onError() 统一捕获。
			</view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_DUPLICATED - 重复导航</view>
			<view class="info-text">导航到当前已在的页面时抛出，避免冗余导航。</view>
			<view class="btn btn-danger" @click="testDuplicate">测试重复导航</view>
			<view class="code-block"> // 当前已在 /pages/error/error 页面\nrouter.push('/pages/error/error')\n// => NavigationFailure: NAVIGATION_DUPLICATED </view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_ABORTED - 导航被中止</view>
			<view class="info-text">守卫中调用 next(false) 中止导航时抛出。</view>
			<view class="btn btn-danger" @click="testAborted">测试中止导航</view>
			<view class="code-block"> router.beforeEach((to, from, next) => {\n next(false) // 中止导航\n})\n// => NavigationFailure: NAVIGATION_ABORTED </view>
		</view>

		<view class="section">
			<view class="section-title">ROUTE_NOT_FOUND - 路由未找到</view>
			<view class="info-text">严格模式下，解析未注册的路由时抛出。</view>
			<view class="btn btn-danger" @click="testNotFound">测试未找到路由</view>
			<view class="code-block"> // 严格模式 (strict: true)\nrouter.resolve('/non/existent/path')\n// => RouterError: ROUTE_NOT_FOUND </view>
		</view>

		<view class="section">
			<view class="section-title">router.onError() - 统一错误处理</view>
			<view class="info-text">所有导航错误都会触发 onError 回调，本应用在 main.ts 中已注册。</view>
			<view class="code-block">
				router.onError((error, to, from) => {\n if (error instanceof NavigationFailure) {\n switch (error.code) {\n case 'NAVIGATION_ABORTED': ...\n case 'NAVIGATION_DUPLICATED': ...\n case 'NAVIGATION_CANCELLED': ...\n
				case 'NAVIGATION_API_ERROR': ...\n }\n }\n})
			</view>
		</view>

		<view class="section">
			<view class="section-title">错误码一览</view>
			<view class="code-block">
				enum RouterErrorCode {\n NAVIGATION_ABORTED // 导航被守卫中止\n NAVIGATION_CANCELLED // 导航被取消\n NAVIGATION_DUPLICATED // 重复导航\n ROUTE_NOT_FOUND // 路由未找到\n NAVIGATION_API_ERROR // uni API 调用失败\n
				SETUP_ERROR // 初始化错误\n}
			</view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
	</view>
</template>

<script setup lang="ts">
import { useRouter, NavigationFailure, RouterError, RouterErrorCode } from '@meng-xi/uni-router'

const router = useRouter()

async function testDuplicate() {
	try {
		await router.push('/pages/error/error')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
			uni.showToast({ title: '捕获重复导航错误', icon: 'none' })
		}
	}
}

async function testAborted() {
	const removeGuard = router.beforeEach((to, from, next) => {
		if (to.path === '/pages/about/about') {
			next(false)
			removeGuard()
			return
		}
		next()
	})

	try {
		await router.push('/pages/about/about')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_ABORTED) {
			uni.showToast({ title: '捕获导航中止错误', icon: 'none' })
		}
	}
}

function testNotFound() {
	try {
		router.resolve('/non/existent/path')
	} catch (error) {
		if (error instanceof RouterError && error.code === RouterErrorCode.ROUTE_NOT_FOUND) {
			uni.showToast({ title: '捕获路由未找到错误', icon: 'none' })
		}
	}
}

function goBack() {
	router.back()
}
</script>
