<script>
export default {
	onLaunch: function () {
		console.log('App Launch')

		// #ifdef H5
		this.initPlugins()
		// #endif
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	},
	methods: {
		initPlugins() {
			this.hideInitialLoading()
			this.logVersionInfo()
		},
		hideInitialLoading() {
			const manager = window.__LOADING_MANAGER__
			if (manager && manager.isVisible()) {
				manager.hide()
			}
		},
		logVersionInfo() {
			if (typeof __APP_VERSION__ !== 'undefined') {
				console.log('[App] 版本:', __APP_VERSION__)
			}
			if (typeof __APP_VERSION___INFO !== 'undefined') {
				console.log('[App] 构建时间:', __APP_VERSION___INFO.buildTime)
			}
		}
	}
}
</script>

<style>
/*每个页面公共css */
</style>
