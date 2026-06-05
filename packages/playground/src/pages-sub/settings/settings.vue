<template>
	<view class="container">
		<view class="section">
			<view class="section-title">设置（分包 + 需登录）</view>
			<view class="info-text"> 本页同时具备两个特性： </view>
			<view class="info-text">
				<text class="tag tag-blue">分包页面</text>
				<text class="tag tag-red">requireAuth: true</text>
			</view>
			<view class="info-text" style="color: #34c759; font-weight: 600; margin-top: 16rpx"> 你已成功进入此页面，说明登录验证和分包路由均正常工作。 </view>
		</view>

		<view class="section">
			<view class="section-title">当前路由信息</view>
			<view class="code-block"> path: {{ route.path }}\nname: {{ route.name || '-' }}\nmeta.title: {{ route.meta.title || '-' }}\nmeta.requireAuth: {{ route.meta.requireAuth ?? '-' }} </view>
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
