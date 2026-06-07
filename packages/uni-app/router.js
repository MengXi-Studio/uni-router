import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import routes from './router.config'

const router = createRouter({
	routes,
	strict: true
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

// 全局错误处理
router.onError(error => {
	// 重复导航是正常行为，仅作提示
	if (error.code === 'NAVIGATION_DUPLICATED') {
		console.warn('[Router]', error.message)
		return
	}
	console.error('[Router Error]', error.message || error)
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
