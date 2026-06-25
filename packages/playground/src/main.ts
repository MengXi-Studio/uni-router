import { createSSRApp } from 'vue'
import App from './App.vue'
import { createRouter, NavigationFailure, RouterError, RouterErrorCode } from '@meng-xi/uni-router'
import routes from './router.config'
import { isLoggedIn } from './utils/auth'

const router = createRouter({
	routes,
	strict: true,
	interceptUniApi: true, // 拦截 uni 原生导航 API，确保守卫始终生效
	guardTimeout: 15000, // 守卫超时 15 秒，适用于异步请求较慢的场景
	readyTimeout: 5000 // 路由器就绪超时 5 秒，防止初始化异常时 isReady() 永久挂起
})

// ===== 等待路由器初始化完成 =====
// isReady() 在路由器完成初始化后 resolve；若配置了 readyTimeout 且超时则 reject
router
	.isReady()
	.then(() => {
		console.log('[isReady] 路由器初始化完成')
	})
	.catch((error: Error) => {
		console.error('[isReady] 路由器初始化超时:', error.message)
	})

// ===== 全局前置守卫 =====
router.beforeEach((to, from, next) => {
	console.log('[beforeEach]', `从 ${from.fullPath} -> ${to.fullPath}`)

	// 需要登录认证的页面
	if (to.meta.requireAuth && !isLoggedIn.value) {
		console.log('[beforeEach] 需要登录，重定向到登录页')
		// 使用 replace 模式重定向，避免登录页之后残留受保护页面的历史
		next({ name: 'pagesLoginLogin', query: { redirect: to.fullPath } }, { mode: 'replace' })
		return
	}

	next()
})

// ===== 全局解析守卫 =====
router.beforeResolve((to, from, next) => {
	console.log('[beforeResolve]', `从 ${from.fullPath} -> ${to.fullPath}`)
	next()
})

// ===== 全局后置钩子 =====
router.afterEach((to, from) => {
	console.log('[afterEach]', `导航完成: ${from.fullPath} -> ${to.fullPath}`)
	if (to.meta.title) {
		console.log('[afterEach] 页面标题:', to.meta.title)
	}
})

// ===== 路由变化监听 =====
router.onRouteChange((to, from) => {
	console.log('[onRouteChange]', `路由变化: ${from.fullPath} -> ${to.fullPath}`, to._synced ? '(状态同步)' : '')
})

// ===== 错误处理 =====
router.onError((error, to, _from) => {
	if (error instanceof NavigationFailure) {
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
			case RouterErrorCode.NAVIGATION_API_ERROR:
				console.error('[onError] uni API 调用失败:', error.cause)
				break
		}
	} else if (error instanceof RouterError) {
		console.error('[onError] 路由错误:', error.message)
	}
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
