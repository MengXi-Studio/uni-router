import type { NavigationGuard, RouteLocation } from '@/types'
import { RouterErrorCode } from '@/enums'
import { warn } from '@/utils/general'
import type { GuardResult } from '../type'
import { resolveGuardReturn } from './resolve'

/**
 * 执行单个导航守卫，将守卫结果转换为 Promise 形式的 GuardResult
 *
 * 守卫通过返回值控制导航行为：
 * - `undefined` / `void` / `true` — 放行导航
 * - `false` — 中止导航（NAVIGATION_ABORTED）
 * - `string` — 重定向到路径（如 `'/login'`）
 * - `RouteLocationRaw` — 重定向到路由位置（如 `{ name: 'login' }`）
 * - `NavigationRedirect` — 重定向并指定导航方式（如 `{ location: { name: 'login' }, mode: 'replace' }`）
 * - `Error` — 取消导航（NAVIGATION_CANCELLED）
 * - `null` — 等同于 undefined，放行导航
 * - 抛出异常 — 取消导航
 *
 * @param guard - 导航守卫函数
 * @param to - 目标路由
 * @param from - 来源路由
 * @param timeout - 超时时间（毫秒），0 表示禁用超时保护
 * @returns 守卫执行结果
 */
export async function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	let resolved = false
	let timer: ReturnType<typeof setTimeout> | undefined

	// 超时保护
	const timeoutPromise = new Promise<GuardResult>(resolve => {
		if (timeout > 0) {
			timer = setTimeout(() => {
				if (!resolved) {
					resolved = true
					warn(`Navigation guard "${guard.name || 'anonymous'}" timed out after ${timeout / 1000}s. Make sure your guard resolves (returns a value or throws).`)
					resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED })
				}
			}, timeout)
		}
	})

	try {
		const returnValue = guard(to, from)

		// 超时与守卫执行竞速
		const result = await Promise.race([
			Promise.resolve(returnValue).then((value): GuardResult => {
				resolved = true
				if (timer) clearTimeout(timer)
				return resolveGuardReturn(value)
			}),
			timeoutPromise
		])

		return result
	} catch {
		if (!resolved) {
			resolved = true
			if (timer) clearTimeout(timer)
			return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
		}
		// 超时已触发，忽略捕获的异常
		return { type: 'abort', code: RouterErrorCode.NAVIGATION_CANCELLED }
	}
}

/**
 * 依次执行守卫队列，遇到中止或重定向时提前退出
 * @param guards - 守卫函数数组
 * @param to - 目标路由
 * @param from - 来源路由
 * @returns 队列中首个中止或重定向结果，全部通过时返回放行
 */
export async function runGuardQueue(guards: NavigationGuard[], to: RouteLocation, from: RouteLocation, timeout: number): Promise<GuardResult> {
	for (const guard of guards) {
		const result = await runGuard(guard, to, from, timeout)
		if (result.type === 'abort') return result
		if (result.redirect) return result
	}
	return { type: 'next' }
}
