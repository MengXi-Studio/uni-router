<template>
	<view class="container">
		<view class="section">
			<view class="section-title">关于 uni-router</view>
			<view class="info-text"> @meng-xi/uni-router 是一个为 uni-app 提供类似 vue-router 风格的路由管理系统。 </view>
			<view class="info-text">
				本页面是 TabBar 页面，meta 中自动标记了
				<text class="tag tag-blue">isTab: true</text>
			</view>
		</view>

		<view class="section">
			<view class="section-title">核心功能</view>
			<view class="info-text">
				<text class="tag tag-blue">push / replace / back</text>
				<text class="tag tag-green">beforeEach / beforeResolve / afterEach</text>
				<text class="tag tag-orange">命名路由</text>
				<text class="tag tag-red">错误处理</text>
				<text class="tag tag-blue">路由元信息</text>
				<text class="tag tag-green">RouterLink 组件</text>
				<text class="tag tag-orange">uni API 拦截</text>
			</view>
		</view>

		<view class="section">
			<view class="section-title">当前路由信息</view>
			<view class="code-block"> path: {{ route.path }}\nname: {{ route.name || '-' }}\nmeta.isTab: {{ route.meta.isTab ?? '-' }}\nmeta.title: {{ route.meta.title || '-' }} </view>
		</view>

		<view class="section">
			<view class="section-title">路由器 API</view>
			<view class="code-block">
				const router = useRouter()\n\n// 导航\nrouter.push('/pages/detail/detail')\nrouter.replace({ name: 'pagesAboutAbout' })\nrouter.back()\n\n// 守卫\nrouter.beforeEach((to, from, next) =>
				next())\nrouter.beforeResolve((to, from, next) => next())\nrouter.afterEach((to, from) => {})\n\n//
				查询\nrouter.hasRoute('pagesIndexIndex')\nrouter.getRoutes()\nrouter.resolve('/pages/detail/detail')\nrouter.isReady()\n\n// 错误\nrouter.onError((err, to, from) => {})
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
</script>
