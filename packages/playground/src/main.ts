import { createSSRApp } from 'vue'
import App from './App.vue'
import { createRouter, NavigationFailure, RouterError, RouterErrorCode } from '@meng-xi/uni-router'
import routes from './router.config'
import { isLoggedIn } from './utils/auth'

const router = createRouter({
	routes,
	strict: true,
	interceptUniApi: true,
	guardTimeout: 15000 // 守卫超时 15 秒，适用于异步请求较慢的场景
})

// ===== 全局前置守卫 =====
router.beforeEach((to, from, next) => {
	console.log('[beforeEach]', `从 ${from.fullPath} -> ${to.fullPath}`)

	// 需要登录认证的页面
	if (to.meta.requireAuth && !isLoggedIn.value) {
		console.log('[beforeEach] 需要登录，重定向到登录页')
		next({ name: 'pagesLoginLogin', query: { redirect: to.fullPath } })
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
