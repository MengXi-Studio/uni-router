import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import {
	buildProgress,
	bundleAnalyzer,
	copyFile,
	envGuard,
	generateVersion,
	generateRouter,
	faviconManager,
	loadingManager,
	versionUpdateChecker,
	htmlInject,
	compressAssets,
	autoImport
} from './uni_modules/mxuni-router/js_sdk/index.mjs'
import { resolve } from 'node:path'

export default defineConfig(config => {
	const viteEnv = loadEnv(config.mode, process.cwd())

	const isH5 = process.env.UNI_PLATFORM === 'h5'
	const isProd = viteEnv.VITE_USER_NODE_ENV === 'production'

	return {
		plugins: [
			uni(),

			// 自动导入 - 使用通配符导入 Vue 全部 API
			autoImport({
				imports: {
					vue: ['*']
				},
				dts: 'auto-imports.d.ts',
				vueTemplate: true,
				enabled: isH5
			}),

			// 环境变量校验
			envGuard({
				required: {
					VITE_APP_TITLE: { type: 'string', required: true, minLength: 1, maxLength: 50 },
					VITE_API_URL: { type: 'url', required: true },
					VITE_DEBUG: { type: 'boolean', required: false }
				},
				failAction: 'warn'
			}),

			// 构建进度条
			buildProgress({
				format: 'bar',
				clearOnComplete: false,
				showModuleName: true
			}),

			// 路由生成 + 类型声明
			generateRouter({
				pagesJsonPath: 'pages.json',
				outputPath: 'router.config.ts',
				dts: 'router.d.d.ts',
				metaMapping: {
					navigationBarTitleText: 'title',
					requireAuth: 'requireAuth'
				}
			}),

			// 版本生成
			generateVersion({
				format: 'custom',
				customFormat: '{YYYY}.{MM}.{DD}-{hash}',
				prefix: 'v',
				outputType: 'both',
				defineName: '__APP_VERSION__',
				enabled: isH5 && isProd,
				extra: {
					environment: isProd ? 'production' : 'development',
					author: 'MengXi Studio'
				}
			}),

			// HTML 注入
			htmlInject({
				rules: [
					{
						id: 'meta-description',
						content: '<meta name="description" content="{{appName}} - 基于 Vite 的 uni-app 插件功能验证项目">',
						position: 'head-end',
						priority: 10,
						templateVars: { appName: 'MengXi Studio' }
					},
					{
						id: 'meta-keywords',
						content: '<meta name="keywords" content="uni-app, vite-plugin, mengxi-studio">',
						position: 'head-end',
						priority: 20
					},
					{
						id: 'theme-color',
						content: '<meta name="theme-color" content="#007aff">',
						position: 'head-end',
						priority: 30
					},
					{
						id: 'apple-mobile-web-app',
						content: '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default">',
						position: 'head-end',
						priority: 40
					}
				],
				enabled: isH5
			}),

			// 网站图标管理
			faviconManager({
				base: viteEnv.VITE_BASE_URL,
				enabled: isH5 && isProd,
				copyOptions: {
					sourceDir: resolve('public'),
					targetDir: resolve('dist/build/h5')
				}
			}),

			// 文件复制
			copyFile({
				sourceDir: resolve('public'),
				targetDir: resolve('dist/build/h5'),
				enabled: isH5 && isProd
			}),

			// 构建产物压缩
			compressAssets({
				algorithm: 'both',
				threshold: 1024,
				reportOutput: 'compress-report.json',
				enabled: isH5 && isProd
			}),

			// 构建产物体积分析
			bundleAnalyzer({
				outputFormat: 'json',
				sizeThreshold: 100,
				topModules: 10,
				gzipSize: true,
				enabled: isH5 && isProd
			}),

			// 全局 Loading 状态管理
			loadingManager({
				defaultVisible: true,
				autoHideOn: 'DOMContentLoaded',
				style: {
					overlayColor: 'rgba(255, 255, 255, 0.85)',
					spinnerColor: '#007aff',
					backdropBlur: true,
					backdropBlurAmount: 3
				},
				transition: {
					duration: 300
				},
				minDisplayTime: {
					duration: 500
				},
				debounceHide: {
					enabled: true
				},
				autoBind: 'all',
				requestFilter: {
					excludeUrlPrefixes: ['/static/', '/api/health']
				},
				callbacks: {
					onShow: 'console.log("[Loading] shown")',
					onHide: 'console.log("[Loading] hidden")'
				},
				enabled: isH5
			}),

			// 版本更新检测
			versionUpdateChecker({
				checkInterval: 60000,
				onUpdateAvailable: 'console.log("[VersionUpdate] 当前:", currentVersion, "最新:", newVersion); return true;',
				onRefresh: 'console.log("[VersionUpdate] 用户选择刷新")',
				onDismiss: 'console.log("[VersionUpdate] 用户选择忽略")',
				enabled: isH5 && isProd
			})
		]
	}
})
