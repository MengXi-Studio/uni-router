<script>
import router from './router'

export default {
	onLaunch: function () {
		console.log('App Launch')
	},
	onShow: function () {
		console.log('App Show')
		// 应用从后台回到前台时同步路由状态
		// 注意：页面切换时的状态同步应在各页面的 onShow 中调用 syncRoute()
		router.syncRoute()
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style>
/* 每个页面公共css */
page {
	background-color: #f5f5f5;
}
</style>
