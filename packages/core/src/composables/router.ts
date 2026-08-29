import { inject } from 'vue'
import type { Router } from '@/types'
import { RouterErrorCode } from '@/enums'
import { RouterError } from '@/errors'
import { ROUTER_SYMBOL } from '@/router'

/**
 * 获取当前路由器实例
 *
 * 必须在 Vue 组件的 setup() 函数中调用，且需先通过 `app.use(router)` 安装路由器。
 * 内部通过 Vue 的 inject 机制获取路由器实例。
 *
 * @returns 路由器实例
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { useRouter } from '@meng-xi/uni-router'
 *
 * const router = useRouter()
 * await router.push({ name: 'home' })
 * ```
 */
export function useRouter(): Router {
	let router: Router | undefined
	try {
		router = inject<Router>(ROUTER_SYMBOL)
	} catch {
		throw new RouterError(RouterErrorCode.SETUP_ERROR, 'useRouter() must be called inside setup() of a Vue component')
	}
	if (!router) {
		throw new RouterError(RouterErrorCode.SETUP_ERROR, 'useRouter() requires router.install(app) to be called first')
	}
	return router
}
