// src/router/index.ts —— 参考 packages/playground/src/main.ts 的实测配置
// 未用到的插件可直接从 plugins 数组移除，同时删掉对应选项，否则只会告警不生效。
import {
	createRouter,
	ParamsPlugin,
	ChannelPlugin,
	InterceptorPlugin,
	AnimationPlugin,
	RouterErrorCode,
	isNavigationFailure
} from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

// 用 generateRouter 时改为：import routes from './router.config'
export const routes: RouteConfig[] = [
	// path 必须与 pages.json 一致（不强制前导 /，内部会规范化）；分包写 `分包根/页面路径`
	// meta.isTab 必须与 pages.json 的 tabBar.list 一致，否则 switchTab / navigateTo 会失败
	{ path: 'pages/index/index', name: 'home', meta: { title: '首页', isTab: true } },
	{ path: 'pages/detail/detail', name: 'detail', meta: { title: '详情' } },
	{ path: 'pages/protected/protected', name: 'protected', meta: { title: '受保护页', requireAuth: true } },
	{ path: 'pages/login/login', name: 'login', meta: { title: '登录' } },
	{ path: 'pages-sub/settings/settings', name: 'settings', meta: { title: '设置', requireAuth: true } },
	{
		path: 'pages/guards/guards',
		name: 'guards',
		meta: { title: '守卫演示' },
		// 路由独享守卫：只在进入本路由时执行；自动生成文件重新生成时会被覆盖
		beforeEnter: (to, from) => {
			console.log('[beforeEnter]', from.fullPath, '->', to.fullPath)
		}
	}
]

export const router = createRouter({
	routes,
	strict: true, // 未匹配的命名路由抛 ROUTE_NOT_FOUND
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin], // 按需注册
	interceptUniApi: true, // 需 InterceptorPlugin：让 uni.navigateTo 等也走守卫
	guardTimeout: 15000, // 默认 10000，异步守卫较慢时调大
	readyTimeout: 5000, // 默认 0（永不超时）
	useUniEventChannel: true, // 需 ChannelPlugin：所有导航方式都支持页面通信
	paramsPersistent: false, // 需 ParamsPlugin：params 默认不持久化
	app: {
		// 仅 iOS：'none' 让侧滑返回走守卫链；'close' 保留原生手势（绕过守卫）
		setSideSlipGesture: (to) => (to.meta.requireAuth ? 'none' : 'close')
	}
})

// ===== 前置守卫：登录鉴权 =====
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !uni.getStorageSync('token')) {
		// 可控重定向：显式 replace，避免登录页残留在栈中形成"未登录中间态"
		return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
	}
	if (to.name === 'login' && uni.getStorageSync('token')) return { name: 'home' }
	// 不返回值 = 放行
})

router.beforeResolve((to, from) => {
	console.log('[beforeResolve]', from.fullPath, '->', to.fullPath)
})

// ===== 后置钩子：标题 / 埋点（不参与控制；状态同步不触发它）=====
router.afterEach((to, _from, failure) => {
	if (failure) return
	uni.setNavigationBarTitle({ title: to.meta.title || '默认标题' })
})

// ===== 返回守卫：未保存拦截 =====
router.onBeforeBack(() => {
	// return false 阻止返回；支持 Promise（如 uni.showModal）
})

// ===== 路由变化监听：覆盖导航 + 状态同步 =====
router.onRouteChange((to, from) => {
	console.log('[onRouteChange]', from.fullPath, '->', to.fullPath, to._synced ? '(状态同步)' : '')
})

// ===== 全局错误：日志 / 通用提示（与 try-catch 都会触发）=====
router.onError((error, to) => {
	if (isNavigationFailure(error)) {
		switch (error.code) {
			case RouterErrorCode.NAVIGATION_DUPLICATED:
				return // 重复点击，静默
			case RouterErrorCode.ROUTE_NOT_FOUND:
				uni.showToast({ title: '页面不存在', icon: 'none' })
				return
			case RouterErrorCode.NAVIGATION_API_ERROR:
				console.error('[router] uni API 失败:', error.cause)
				return
		}
	}
	console.warn('[router]', error.code, to.fullPath, error.message)
})

export default router
