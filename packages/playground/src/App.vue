<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
	console.log('App Launch')
})

onShow(() => {
	console.log('App Show')
	// 应用从后台回到前台时同步路由状态
	// 注意：页面切换时的状态同步应在各页面的 onShow 中调用 syncRoute()
	router.syncRoute()
})

onHide(() => {
	console.log('App Hide')
})
</script>

<style>
page {
	background-color: #f5f5f5;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.container {
	padding: 30rpx;
}

.section {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
	margin-bottom: 20rpx;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid #eeeeee;
}

.btn {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	background-color: #007aff;
	color: #ffffff;
	font-size: 30rpx;
	border-radius: 12rpx;
	margin-bottom: 16rpx;
}

.btn:active {
	opacity: 0.8;
}

.btn-warn {
	background-color: #ff9500;
}

.btn-danger {
	background-color: #ff3b30;
}

.btn-success {
	background-color: #34c759;
}

.btn-gray {
	background-color: #8e8e93;
}

.info-text {
	font-size: 26rpx;
	color: #666666;
	line-height: 1.6;
	margin-bottom: 12rpx;
}

.code-block {
	background-color: #f0f0f0;
	border-radius: 8rpx;
	padding: 16rpx;
	font-family: 'Menlo', 'Courier New', monospace;
	font-size: 24rpx;
	color: #333;
	margin-bottom: 16rpx;
	overflow-x: auto;
}

.tag {
	display: inline-block;
	padding: 4rpx 16rpx;
	border-radius: 6rpx;
	font-size: 22rpx;
	margin-right: 8rpx;
	margin-bottom: 8rpx;
}

.tag-blue {
	background-color: #e6f2ff;
	color: #007aff;
}

.tag-green {
	background-color: #e8f8e8;
	color: #34c759;
}

.tag-orange {
	background-color: #fff3e0;
	color: #ff9500;
}

.tag-red {
	background-color: #ffebeb;
	color: #ff3b30;
}

.tag-purple {
	background-color: #f0e6ff;
	color: #af52de;
}
</style>
