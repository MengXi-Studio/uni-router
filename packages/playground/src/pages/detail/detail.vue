<template>
	<view class="container">
		<view class="section">
			<view class="section-title">详情页</view>
			<view class="info-text">本页通过 push 导航到达，接收了以下查询参数：</view>
			<view class="code-block">
				path: {{ route.path }}\nname: {{ route.name || '-' }}\nfullPath: {{ route.fullPath }}\n\nquery:\n<template v-for="(val, key) in route.query" :key="key"> {{ key }}: {{ val }}\n</template>
			</view>
		</view>

		<view class="section">
			<view class="section-title">useRoute() - 获取当前路由（响应式）</view>
			<view class="info-text">useRoute() 返回 Ref&lt;RouteLocation&gt;，路由变化时自动更新组件。</view>
			<view class="code-block"> import { useRoute } from '@meng-xi/uni-router'\nconst route = useRoute()\n// script 中: route.value.query.id\n// 模板中: route.query.id（自动解包） </view>
		</view>

		<view class="section">
			<view class="section-title">useRouter() - 获取路由器实例</view>
			<view class="code-block"> import { useRouter } from '@meng-xi/uni-router'\nconst router = useRouter()\nawait router.back() </view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
	</view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

function goBack() {
	router.back()
}
</script>
