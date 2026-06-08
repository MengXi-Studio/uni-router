import { createRouter, NavigationFailure, RouterError, RouterErrorCode } from './uni_modules/mxuni-router/js_sdk/index.js'
import routes from './router.config'

const router = createRouter({
	routes,
	strict: true,
	interceptUniApi: true,
	guardTimeout: 15000
})

// 登录状态（简单模拟，实际项目应从存储中读取）
let isLoggedIn = false

// 全局前置守卫 - 登录验证
router.beforeEach((to, from, next) => {
	console.log(`[beforeEach] ${from.path} → ${to.path}`)

	if (to.meta.requireAuth && !isLoggedIn) {
		console.log('[beforeEach] 需要登录，重定向到登录页')
		next({ path: '/pages/login/index', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 全局解析守卫
router.beforeResolve((to, from, next) => {
	console.log(`[beforeResolve] ${from.path} → ${to.path}`)
	next()
})

// 全局后置钩子
router.afterEach((to, from) => {
	console.log(`[afterEach] 导航完成: ${from.path} → ${to.path}`)
})

// 路由变化监听
router.onRouteChange((to, from) => {
	console.log(`[onRouteChange] 路由变化: ${from.fullPath} → ${to.fullPath}`, to._synced ? '(状态同步)' : '')
})

// 全局错误处理
router.onError((error, to, from) => {
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
