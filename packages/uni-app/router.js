import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin, RouterError, RouterErrorCode, isNavigationFailure } from './uni_modules/mxuni-router-v2/js_sdk/index.js'
import routes from './router.config'

const router = createRouter({
	routes,
	strict: true,
	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin], // 按需注册插件，未注册的插件功能不可用
	interceptUniApi: true, // 需要 InterceptorPlugin，拦截 uni 原生导航 API，确保守卫始终生效
	guardTimeout: 15000, // 守卫超时 15 秒，适用于异步请求较慢的场景
	readyTimeout: 5000, // 路由器就绪超时 5 秒，防止初始化异常时 isReady() 永久挂起
	paramsPersistent: false, // 需要 ParamsPlugin，params 持久化默认值
	useUniEventChannel: true, // 需要 ChannelPlugin，启用内置通信管理器
	app: {
		// 控制 iOS 侧滑返回手势（仅 iOS 生效，见 pages/guards/index.vue 说明）：
		// 'none' 禁用侧滑返回（返回操作走守卫链，onBeforeBack 生效）
		// 'close' 开启原生侧滑返回（保留原生手势，侧滑绕过守卫）
		setSideSlipGesture(to) {
			return to.meta.requireAuth ? 'none' : 'close'
		}
	}
})

// ===== 等待路由器初始化完成 =====
// isReady() 在路由器完成初始化后 resolve；若配置了 readyTimeout 且超时则 reject
router
	.isReady()
	.then(() => {
		console.log('[isReady] 路由器初始化完成')
	})
	.catch(error => {
		console.error('[isReady] 路由器初始化超时:', error.message)
	})

// 登录状态（简单模拟，实际项目应从存储中读取）
let isLoggedIn = false

// 全局前置守卫 - 登录验证
router.beforeEach((to, from) => {
	console.log(`[beforeEach] ${from.path} → ${to.path}`)

	if (to.meta.requireAuth && !isLoggedIn) {
		console.log('[beforeEach] 需要登录，重定向到登录页')
		// 可控重定向：显式指定 replace，避免登录页残留在页面栈中
		return { location: { path: '/pages/login/index', query: { redirect: to.fullPath } }, mode: 'replace' }
	}
	// 不返回值 = 放行
})

// 全局解析守卫
router.beforeResolve((to, from) => {
	console.log(`[beforeResolve] ${from.path} → ${to.path}`)
})

// 全局后置钩子（支持 failure 参数）
router.afterEach((to, from, failure) => {
	if (failure) {
		console.error(`[afterEach] 导航失败: ${failure.message}`)
		return
	}
	console.log(`[afterEach] 导航完成: ${from.path} → ${to.path}`)
})

// 全局返回守卫（onBeforeBack）
// 返回操作（App 物理返回键 / 导航栏返回 / uni.navigateBack，H5 浏览器后退 / 后退手势，router.back()）
// 会先执行 onBeforeBack：返回 false 阻止返回，true / undefined 放行，支持异步（Promise）。
// 守卫放行后复用 beforeEach → beforeResolve 链路。
router.onBeforeBack((to, from) => {
	console.log(`[onBeforeBack] 从 ${from.path} 返回到 ${to.path}`)
	// 返回 false 可阻止返回（如未保存的修改）
	// 本示例仅记录日志，默认放行
})

// 路由变化监听
router.onRouteChange((to, from) => {
	console.log(`[onRouteChange] 路由变化: ${from.fullPath} → ${to.fullPath}`, to._synced ? '(状态同步)' : '')
})

// 全局错误处理
router.onError((error, to, from) => {
	if (isNavigationFailure(error)) {
		switch (error.code) {
			case RouterErrorCode.NAVIGATION_ABORTED:
				console.warn('[onError] 导航被守卫中止:', to.fullPath)
				break
			case RouterErrorCode.NAVIGATION_DUPLICATED:
				console.warn('[onError] 重复导航:', to.fullPath)
				break
			case RouterErrorCode.NAVIGATION_CANCELLED:
				console.warn('[onError] 导航被取消:', to.fullPath)
				break
			case RouterErrorCode.ROUTE_NOT_FOUND:
				console.warn('[onError] 路由未找到:', to.fullPath)
				uni.showToast({ title: '页面不存在', icon: 'none' })
				break
			case RouterErrorCode.NAVIGATION_API_ERROR:
				console.error('[onError] uni API 调用失败:', error.cause)
				break
		}
	} else if (error instanceof RouterError) {
		switch (error.code) {
			case RouterErrorCode.SETUP_ERROR:
				console.error('[onError] 路由器初始化错误:', error.message)
				break
			default:
				console.error('[onError] 路由错误:', error.message)
		}
	}
})

// 登录状态管理
export const auth = {
	isLoggedIn: () => isLoggedIn,
	login: () => {
		isLoggedIn = true
	},
	logout: () => {
		isLoggedIn = false
	}
}

export default router
