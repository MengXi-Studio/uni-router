<template>
	<view class="container">
		<view class="section">
			<view class="section-title">router.resolve() - 路由解析</view>
			<view class="info-text">resolve() 可在不执行导航的情况下解析路由位置信息。</view>
		</view>

		<view class="section">
			<view class="section-title">解析路径字符串</view>
			<view class="btn" @click="resolvePath">resolve('/pages/detail/detail')</view>
			<view v-if="resolved1" class="code-block"> path: {{ resolved1.path }}\nname: {{ resolved1.name }}\nfullPath: {{ resolved1.fullPath }}\nmeta.title: {{ resolved1.meta.title || '-' }} </view>
		</view>

		<view class="section">
			<view class="section-title">解析路径对象</view>
			<view class="btn btn-success" @click="resolvePathObj">resolve({ path, query })</view>
			<view v-if="resolved2" class="code-block"> path: {{ resolved2.path }}\nname: {{ resolved2.name }}\nfullPath: {{ resolved2.fullPath }}\nquery: {{ JSON.stringify(resolved2.query) }} </view>
		</view>

		<view class="section">
			<view class="section-title">解析命名路由</view>
			<view class="btn btn-warn" @click="resolveName">resolve({ name, query })</view>
			<view v-if="resolved3" class="code-block"> path: {{ resolved3.path }}\nname: {{ resolved3.name }}\nfullPath: {{ resolved3.fullPath }}\nquery: {{ JSON.stringify(resolved3.query) }} </view>
		</view>

		<view class="section">
			<view class="section-title">router.hasRoute() - 检查路由</view>
			<view class="btn" @click="checkRoute">检查路由是否存在</view>
			<view v-if="hasRouteResult !== null" class="code-block"> hasRoute('pagesDetailDetail'): {{ hasRouteResult }}\nhasRoute('nonExistent'): {{ hasRouteNonExistent }} </view>
		</view>

		<view class="section">
			<view class="section-title">router.getRoutes() - 获取所有路由</view>
			<view class="btn btn-success" @click="showRoutes">获取路由列表</view>
			<view v-if="routesList.length" class="code-block">
				<template v-for="r in routesList" :key="r.path">{{ r.name }} -> {{ r.path }}\n</template>
			</view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, type RouteLocation } from '@meng-xi/uni-router'

const router = useRouter()

const resolved1 = ref<RouteLocation | null>(null)
const resolved2 = ref<RouteLocation | null>(null)
const resolved3 = ref<RouteLocation | null>(null)
const hasRouteResult = ref<boolean | null>(null)
const hasRouteNonExistent = ref(false)
const routesList = ref<any[]>([])

function resolvePath() {
	resolved1.value = router.resolve('/pages/detail/detail')
}

function resolvePathObj() {
	resolved2.value = router.resolve({
		path: '/pages/detail/detail',
		query: { id: '100', tab: 'info' }
	})
}

function resolveName() {
	resolved3.value = router.resolve({
		name: 'pagesDetailDetail',
		query: { id: '200', source: 'resolve' }
	})
}

function checkRoute() {
	hasRouteResult.value = router.hasRoute('pagesDetailDetail')
	hasRouteNonExistent.value = router.hasRoute('nonExistent')
}

function showRoutes() {
	routesList.value = router.getRoutes()
}

function goBack() {
	router.back()
}
</script>
