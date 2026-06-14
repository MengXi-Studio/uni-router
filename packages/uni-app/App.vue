<script>
import router from './router'

export default {
	onLaunch: function () {
		console.log('App Launch')
	},
	onShow: function () {
		console.log('App Show')
		// 同步路由状态，处理浏览器后退/物理返回键等非路由器导航场景
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
