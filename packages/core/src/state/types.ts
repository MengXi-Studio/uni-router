import type { RouteLocation } from '@/types'

/**
 * 路由变化监听器函数类型
 * @param to - 新的路由位置
 * @param from - 之前的路由位置
 */
export type RouteChangeListener = (to: RouteLocation, from: RouteLocation) => void
