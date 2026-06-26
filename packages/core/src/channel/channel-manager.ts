import type { EventListeners, NavigationId, UniEventChannel } from '@/types'
import { UniEventChannel as UniEventChannelImpl, NoOpUniEventChannel } from './uni-event-channel'
import type { RegisteredEventsMap, ChannelCache } from './types'

/**
 * 通信通道管理器接口
 *
 * 职责：
 * 1. 生成唯一 navigationId
 * 2. 创建并缓存通道实例（调用方侧）
 * 3. 跟踪每个通道已注册的事件名，用于 destroy 时精确清理
 * 4. 目标页面侧通过 navigationId 获取对应通道
 * 5. 在页面卸载时清理通道监听器
 */
export interface ChannelManager {
	/** 为本次导航创建通道，返回 navigationId 和调用方侧 channel */
	createChannel(events?: EventListeners): { navigationId: NavigationId; channel: UniEventChannel }
	/** 目标页面侧通过 navigationId 获取通道（不存在时返回 no-op 通道，优雅降级） */
	getReceiverChannel(navigationId: NavigationId): UniEventChannel
	/** 获取全局共享的 no-op 通道实例 */
	getNoOpChannel(): UniEventChannel
	/** 销毁指定通道的所有监听器（页面卸载时调用，幂等） */
	destroyChannel(navigationId: NavigationId): void
	/** 销毁所有通道（路由器初始化时调用，清理上次运行残留） */
	destroyAll(): void
}

/**
 * 生成短随机导航标识
 *
 * 格式：nav_ + 时间戳(base36) + 6位十六进制随机数
 * 碰撞概率极低，足够用于单次导航标识
 */
function generateNavId(): NavigationId {
	const hex = Math.floor(Math.random() * 0xffffff)
		.toString(16)
		.padStart(6, '0')
	const time = Date.now().toString(36)
	return `nav_${time}_${hex}`
}

/**
 * 创建通信通道管理器
 *
 * 管理基于 `uni.$emit` / `uni.$on` 的页面间通信通道生命周期。
 *
 * @returns ChannelManager 实例
 */
export function createChannelManager(): ChannelManager {
	/** navigationId -> 已注册的事件名集合（用于 destroy 时精确 off） */
	const registeredEvents: RegisteredEventsMap = new Map()
	/** navigationId -> channel 实例缓存 */
	const channelCache: ChannelCache = new Map()
	/** 全局共享的 no-op 通道实例（避免重复创建） */
	let noOpChannel: UniEventChannel | null = null

	function createChannel(events?: EventListeners): { navigationId: NavigationId; channel: UniEventChannel } {
		const navigationId = generateNavId()
		const channel = new UniEventChannelImpl(navigationId, false)
		channelCache.set(navigationId, channel)
		registeredEvents.set(navigationId, new Set())

		// 调用方 events：监听目标页面发来的事件
		if (events) {
			for (const [eventName, callback] of Object.entries(events)) {
				channel.on(eventName, callback)
				registeredEvents.get(navigationId)!.add(eventName)
			}
		}
		return { navigationId, channel }
	}

	function getReceiverChannel(navigationId: NavigationId): UniEventChannel {
		const cached = channelCache.get(navigationId)
		if (cached) return cached
		// 不存在时返回 no-op 通道（优雅降级），不抛错
		return getNoOpChannel()
	}

	function getNoOpChannel(): UniEventChannel {
		if (!noOpChannel) {
			noOpChannel = new NoOpUniEventChannel()
		}
		return noOpChannel
	}

	function destroyChannel(navigationId: NavigationId): void {
		const events = registeredEvents.get(navigationId)
		if (events) {
			const channel = channelCache.get(navigationId)
			if (channel) {
				for (const eventName of events) {
					channel.off(eventName)
				}
			}
			registeredEvents.delete(navigationId)
		}
		channelCache.delete(navigationId)
	}

	function destroyAll(): void {
		for (const navId of registeredEvents.keys()) {
			destroyChannel(navId)
		}
	}

	return { createChannel, getReceiverChannel, getNoOpChannel, destroyChannel, destroyAll }
}
