<template>
	<view class="container">
		<image class="logo" src="/static/logo.png" />
		<view class="text-area">
			<text class="title">{{ title }}</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const title = ref('Hello test')
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
