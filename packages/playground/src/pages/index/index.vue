<template>
	<view class="container">
		<image class="logo" src="/static/logo.png" />

		<view class="text-area" @click="toTest">
			<text class="title">{{ title }}</text>
		</view>

		<view>111</view>

		<navigator url="/pages/test/index">
			<text>原生组件测试</text>
		</navigator>

		<mx-router @register="register">
			<text>MX组件测试</text>
		</mx-router>

		<router-link to="/pages/test/index">
			<text>MX组件测试1</text>
		</router-link>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import router from '@/router'
import { useMxRouter } from '@meng-xi/uni-router'
import RouterLink from '@meng-xi/uni-router/components/router/router.vue'

const [register] = useMxRouter({
	to: '/pages/test/index'
})

const title = ref('Hello')

function toTest() {
	router.push({
		path: '/pages/test/index',
		query: {
			name: 'Test User',
			age: 25
		}
	})
}
</script>

<style lang="scss">
.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.logo {
	height: 200rpx;
	width: 200rpx;
	margin-top: 200rpx;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: 50rpx;
}

.text-area {
	display: flex;
	justify-content: center;
}

.title {
	font-size: 36rpx;
	color: $uni-color-primary;
}
</style>
