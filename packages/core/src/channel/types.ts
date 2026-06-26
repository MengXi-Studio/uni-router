import type { NavigationId, UniEventChannel } from '@/types'

/**
 * 通道已注册的事件名集合映射
 *
 * 用于 destroy 时精确 off，避免 uni.$off(event) 误删其他通道的监听器
 */
export type RegisteredEventsMap = Map<NavigationId, Set<string>>

/**
 * 通道实例缓存
 *
 * 同一 navigationId 共享同一个 UniEventChannel 实例（调用方侧与目标页面侧）
 */
export type ChannelCache = Map<NavigationId, UniEventChannel>
