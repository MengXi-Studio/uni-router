import type { NavigationRedirectMode, RouteLocationRaw } from '@/types'
import { RouterErrorCode } from '@/types/error'

/**
 * 守卫执行结果，表示导航是被放行、重定向还是中止
 *
 * redirect 时的 mode 表示使用者通过 next(location, { mode }) 指定的重定向方式，
 * 未指定时为 undefined，由路由器沿用原始导航方式。
 */
export type GuardResult = { type: 'next'; redirect?: RouteLocationRaw; mode?: NavigationRedirectMode } | { type: 'abort'; code: RouterErrorCode }
