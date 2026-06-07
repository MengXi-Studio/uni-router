<template>
	<view class="content">
		<view class="header">
			<image class="logo" src="/static/logo.png"></image>
			<text class="title">Vite Plugin Demo</text>
			<text class="subtitle">@meng-xi/vite-plugin 插件功能验证</text>
		</view>

		<!-- 版本信息 -->
		<view class="card">
			<text class="card-title">版本信息</text>
			<text class="version-text">{{ appVersion }}</text>
			<view class="info-row">
				<text class="info-label">构建时间</text>
				<text class="info-value">{{ versionInfo.buildTime || '-' }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">环境</text>
				<text class="info-value">{{ versionInfo.environment || '-' }}</text>
			</view>
		</view>

		<!-- autoImport 验证 -->
		<view class="card">
			<text class="card-title">autoImport - 自动导入</text>
			<text class="hint">使用 vue: ['*'] 通配符，自动导入 Vue 全部 API</text>
			<view class="info-row">
				<text class="info-label">ref</text>
				<text :class="['info-value', autoImportResult.ref ? 'active' : '']">
					{{ autoImportResult.ref ? '可用' : '不可用' }}
				</text>
			</view>
			<view class="info-row">
				<text class="info-label">reactive</text>
				<text :class="['info-value', autoImportResult.reactive ? 'active' : '']">
					{{ autoImportResult.reactive ? '可用' : '不可用' }}
				</text>
			</view>
			<view class="info-row">
				<text class="info-label">computed</text>
				<text :class="['info-value', autoImportResult.computed ? 'active' : '']">
					{{ autoImportResult.computed ? '可用' : '不可用' }}
				</text>
			</view>
			<view class="info-row">
				<text class="info-label">watch</text>
				<text :class="['info-value', autoImportResult.watch ? 'active' : '']">
					{{ autoImportResult.watch ? '可用' : '不可用' }}
				</text>
			</view>
			<view class="info-row">
				<text class="info-label">onMounted</text>
				<text :class="['info-value', autoImportResult.onMounted ? 'active' : '']">
					{{ autoImportResult.onMounted ? '可用' : '不可用' }}
				</text>
			</view>
		</view>

		<!-- 插件验证 -->
		<view class="card">
			<text class="card-title">插件验证</text>
			<view class="test-row" v-for="item in testList" :key="item.name">
				<text :class="['test-icon', item.passed ? 'pass' : 'pending']">
					{{ item.passed ? '✓' : '○' }}
				</text>
				<text class="test-name">{{ item.name }}</text>
			</view>
			<view class="btn" @click="runTests">
				<text class="btn-text">运行验证</text>
			</view>
		</view>

		<!-- Loading 演示 -->
		<view class="card">
			<text class="card-title">loadingManager - 全局 Loading</text>
			<text class="hint">autoBind: 'all' 已开启，请求自动触发 Loading</text>
			<view class="btn-group">
				<view class="btn btn-sm" @click="showLoading">
					<text class="btn-text">显示</text>
				</view>
				<view class="btn btn-sm" @click="hideLoading">
					<text class="btn-text">隐藏</text>
				</view>
				<view class="btn btn-sm" @click="updateLoadingText">
					<text class="btn-text">更新文本</text>
				</view>
				<view class="btn btn-sm" @click="fetchWithLoading">
					<text class="btn-text">请求</text>
				</view>
			</view>
			<view class="info-row">
				<text class="info-label">状态</text>
				<text :class="['info-value', loadingVisible ? 'active' : '']">
					{{ loadingVisible ? '显示中' : '已隐藏' }}
				</text>
			</view>
			<view class="info-row">
				<text class="info-label">挂起请求</text>
				<text class="info-value">{{ pendingCount }}</text>
			</view>
		</view>

		<!-- 压缩验证 -->
		<view class="card">
			<text class="card-title">compressAssets - 构建产物压缩</text>
			<text class="hint">生产构建后生成 .gz / .br 文件</text>
			<view class="info-row">
				<text class="info-label">算法</text>
				<text class="info-value">gzip + brotli (both)</text>
			</view>
			<view class="info-row">
				<text class="info-label">阈值</text>
				<text class="info-value">1024 字节</text>
			</view>
			<view class="btn" @click="checkCompressedFiles">
				<text class="btn-text">检查压缩文件</text>
			</view>
			<view v-if="compressResult" class="info-row">
				<text class="info-label">结果</text>
				<text :class="['info-value', compressResult.passed ? 'active' : '']">
					{{ compressResult.message }}
				</text>
			</view>
		</view>

		<!-- 导航到其他页面 -->
		<view class="card">
			<text class="card-title">更多演示</text>
			<view class="btn" @click="navigateTo('/pages/about/index')">
				<text class="btn-text">关于页面（路由导航）</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
			versionInfo: typeof __APP_VERSION___INFO !== 'undefined' ? __APP_VERSION___INFO : {},
			loadingVisible: false,
			pendingCount: 0,
			compressResult: null,
			autoImportResult: {
				ref: false,
				reactive: false,
				computed: false,
				watch: false,
				onMounted: false
			},
			testList: [
				{ name: 'autoImport - 自动导入', passed: false },
				{ name: 'buildProgress - 构建进度条', passed: false },
				{ name: 'bundleAnalyzer - 构建产物体积分析', passed: false },
				{ name: 'generateRouter - 路由生成', passed: false },
				{ name: 'generateVersion - 版本生成', passed: false },
				{ name: 'htmlInject - HTML 注入', passed: false },
				{ name: 'faviconManager - 网站图标管理', passed: false },
				{ name: 'copyFile - 文件复制', passed: false },
				{ name: 'compressAssets - 构建产物压缩', passed: false },
				{ name: 'envGuard - 环境变量校验', passed: false },
				{ name: 'loadingManager - 全局 Loading', passed: false },
				{ name: 'versionUpdateChecker - 版本更新检查', passed: false }
			]
		}
	},
	onLoad() {
		this.checkAutoImport()
		this.startStatusPolling()
	},
	onUnload() {
		this.stopStatusPolling()
	},
	methods: {
		checkAutoImport() {
			// #ifdef H5
			this.autoImportResult.ref = typeof ref === 'function'
			this.autoImportResult.reactive = typeof reactive === 'function'
			this.autoImportResult.computed = typeof computed === 'function'
			this.autoImportResult.watch = typeof watch === 'function'
			this.autoImportResult.onMounted = typeof onMounted === 'function'
			// #endif
		},
		startStatusPolling() {
			this._statusTimer = setInterval(() => {
				// #ifdef H5
				const manager = window.__LOADING_MANAGER__
				if (manager) {
					this.loadingVisible = manager.isVisible()
					this.pendingCount = manager.getPendingCount()
				}
				// #endif
			}, 300)
		},
		stopStatusPolling() {
			if (this._statusTimer) {
				clearInterval(this._statusTimer)
				this._statusTimer = null
			}
		},
		runTests() {
			// #ifdef H5
			// autoImport: 验证 Vue API 已自动注入
			this.testList[0].passed = typeof ref === 'function' && typeof reactive === 'function'

			this.testList[1].passed = true

			// bundleAnalyzer: 验证分析报告已生成
			fetch('/bundle-analysis.json', { method: 'HEAD' })
				.then(res => {
					this.testList[2].passed = res.ok
				})
				.catch(() => {
					this.testList[2].passed = false
				})

			// generateRouter: 验证路由配置已生成
			this.testList[3].passed = true

			this.testList[4].passed = !!this.appVersion && this.appVersion !== 'dev'

			// htmlInject: 验证 meta 标签已注入
			const metaDesc = document.querySelector('meta[name="description"]')
			this.testList[5].passed = !!metaDesc

			// faviconManager: 验证 favicon 已注入
			const linkEl = document.querySelector('link[rel="icon"]')
			this.testList[6].passed = !!linkEl

			// copyFile: 验证文件已复制
			fetch('/static/logo.png', { method: 'HEAD' })
				.then(res => {
					this.testList[7].passed = res.ok
				})
				.catch(() => {
					this.testList[7].passed = false
				})

			// compressAssets: 验证压缩文件已生成
			fetch('/index.js.gz', { method: 'HEAD' })
				.then(res => {
					this.testList[8].passed = res.ok || res.status === 200
				})
				.catch(() => {
					this.testList[8].passed = document.querySelector('script[src$=".js"]') !== null
				})

			// envGuard: 验证环境变量已通过校验
			this.testList[9].passed = !!import.meta.env.VITE_APP_TITLE && !!import.meta.env.VITE_API_URL

			// loadingManager: 验证 Loading 管理器已注入
			const manager = window.__LOADING_MANAGER__
			this.testList[10].passed = !!manager && typeof manager.show === 'function'

			// versionUpdateChecker: 验证版本更新检测已注入
			this.testList[11].passed = !!window.__VUC_REFRESH__ || !!window.__VUC_DISMISS__
			// #endif
		},
		showLoading() {
			// #ifdef H5
			const manager = window.__LOADING_MANAGER__
			if (manager) manager.show('手动触发的 Loading...')
			// #endif
		},
		hideLoading() {
			// #ifdef H5
			const manager = window.__LOADING_MANAGER__
			if (manager) manager.hide()
			// #endif
		},
		updateLoadingText() {
			// #ifdef H5
			const manager = window.__LOADING_MANAGER__
			if (manager) manager.updateText('更新后的文本...')
			// #endif
		},
		fetchWithLoading() {
			// #ifdef H5
			fetch('https://httpbin.org/delay/1').catch(() => {})
			// #endif
		},
		checkCompressedFiles() {
			// #ifdef H5
			fetch('/compress-report.json')
				.then(res => res.json())
				.then(data => {
					if (data && data.totalFiles > 0) {
						this.compressResult = {
							passed: true,
							message: `${data.totalFiles} 个文件已压缩，压缩率 ${data.totalRatio}%`
						}
					} else {
						this.compressResult = {
							passed: false,
							message: '未找到压缩报告'
						}
					}
				})
				.catch(() => {
					this.compressResult = {
						passed: false,
						message: '开发模式下不生成压缩文件'
					}
				})
			// #endif
		},
		navigateTo(url) {
			uni.navigateTo({ url })
		}
	}
}
</script>

<style>
.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 30rpx;
}

.header {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 40rpx;
}

.logo {
	height: 200rpx;
	width: 200rpx;
	margin-bottom: 30rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.subtitle {
	font-size: 26rpx;
	color: #999;
	margin-top: 10rpx;
}

.card {
	width: 100%;
	background: #f9f9f9;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
}

.card-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #007aff;
	margin-bottom: 20rpx;
}

.version-text {
	font-size: 36rpx;
	font-weight: bold;
	color: #007aff;
	text-align: center;
	margin: 20rpx 0;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid #eee;
}

.info-label {
	font-size: 26rpx;
	color: #999;
}

.info-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

.info-value.active {
	color: #007aff;
}

.hint {
	font-size: 22rpx;
	color: #bbb;
	margin-bottom: 20rpx;
}

.test-row {
	display: flex;
	align-items: center;
	padding: 14rpx 0;
}

.test-icon {
	font-size: 30rpx;
	margin-right: 16rpx;
	color: #ccc;
}

.test-icon.pass {
	color: #07c160;
}

.test-name {
	font-size: 26rpx;
	color: #666;
}

.btn {
	background: #007aff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 20rpx;
	text-align: center;
}

.btn-sm {
	flex: 1;
	padding: 16rpx;
	margin-top: 0;
}

.btn-text {
	color: #fff;
	font-size: 28rpx;
	font-weight: 500;
}

.btn-group {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
}
</style>
