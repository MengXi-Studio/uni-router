<template>
	<view class="container">
		<view class="section">
			<view class="section-title">个人中心（分包页面）</view>
			<view class="info-text">
				本页位于分包
				<text class="tag tag-blue">pages-sub</text>
				中，路由配置由 generateRouter 插件自动解析子包并生成。
			</view>
		</view>

		<view class="section">
			<view class="section-title">当前路由信息</view>
			<view class="code-block"> path: {{ route.path }}\nname: {{ route.name || '-' }}\nfullPath: {{ route.fullPath }}\nmeta.title: {{ route.meta.title || '-' }} </view>
		</view>

		<view class="section">
			<view class="section-title">分包路由配置</view>
			<view class="code-block">
				// pages.json 中的分包配置\n"subPackages": [{\n "root": "pages-sub",\n "pages": [\n { "path": "profile/profile" }\n ]\n}]\n\n// generateRouter 自动生成\n{\n path: '/pages-sub/profile/profile',\n name:
				'pagesSubProfileProfile',\n meta: { title: '个人中心' }\n}
			</view>
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
