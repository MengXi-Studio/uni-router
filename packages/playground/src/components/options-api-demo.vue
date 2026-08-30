<template>
	<view>
		<view class="info-text">安装路由器后，选项式 API 可通过 <text style="color: #007aff">this.$router</text> / <text style="color: #007aff">this.$route</text> 访问，无需 useRouter / useRoute。</view>
		<view class="code-block"> 当前路径（this.$route.path）：{{ $route.path }}\n当前标题（this.$route.meta.title）：{{ $route.meta.title || '-' }} </view>
		<view class="btn" @click="goDetail">this.$router.push - 命名路由</view>
		<view class="btn btn-warn" @click="goAbout">this.$router.push - TabBar 页面</view>
		<view class="code-block">
			// 选项式 API 全局属性（app.use(router) 时注入）\nthis.$router.push({ name: 'pagesDetailDetail', query: { id: 'options' } })\n\nthis.$router.replace({ name: 'pagesAboutAbout' })\n\n// 读取当前路由\nthis.$route.path
			/ this.$route.query / this.$route.params
		</view>
	</view>
</template>

<script>
export default {
	name: 'OptionsApiDemo',
	methods: {
		/**
		 * 通过 $router 全局属性推入详情页
		 */
		goDetail() {
			this.$router.push({ name: 'pagesDetailDetail', query: { id: 'options-api' } })
		},

		/**
		 * 通过 $router 全局属性导航到 TabBar 页面（自动 switchTab）
		 */
		goAbout() {
			this.$router.push({ name: 'pagesAboutAbout' })
		}
	}
}
</script>
