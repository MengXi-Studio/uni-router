<template>
	<view class="container">
		<view class="section">
			<view class="section-title">受保护页面</view>
			<view class="info-text">
				本页设置了
				<text class="tag tag-red">requireAuth: true</text>
				，未登录用户将被 beforeEach 守卫重定向到登录页。
			</view>
			<view class="info-text" style="color: #34c759; font-weight: 600"> 你已成功进入受保护页面，说明当前处于登录状态。 </view>
		</view>

		<view class="section">
			<view class="section-title">路由元信息 meta</view>
			<view class="code-block"> meta: {\n title: {{ route.meta.title || '-' }},\n requireAuth: {{ route.meta.requireAuth ?? '-' }}\n} </view>
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
