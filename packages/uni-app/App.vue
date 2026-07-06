<script>
import router from './router'
import { RouterErrorCode } from './uni_modules/mxuni-router/js_sdk/index.js'

export default {
	onLaunch: function () {
		console.log('App Launch')

		// ===== 冷启动守卫检查 =====
		// 当用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入页面时，
		// 页面由 uni-app 框架直接加载，不经过路由器导航，守卫未执行。
		// guardRoute() 对当前已加载页面补执行守卫链。
		router.isReady().then(() => {
			router
				.guardRoute(undefined, {
					onAbort: failure => {
						console.warn('[guardRoute] 冷启动守卫中止:', failure.code)
						if (failure.code === RouterErrorCode.NAVIGATION_ABORTED) {
							// 守卫中止（如未登录），跳转到首页
							router.relaunch('/pages/index/index')
						}
					}
				})
				.catch(() => {
					// guardRoute 中止时 reject，已在 onAbort 中处理
				})
		})
	},
	onShow: function () {
		console.log('App Show')
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
