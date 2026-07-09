import type { EventChannel } from '@/types'
import { UniEventChannel } from './uni-event-channel'

/**
 * 活跃通道注册表
 *
 * 按 navId 注册 UniEventChannel 实例，供 usePageChannel() 复用，
 * 并在页面卸载时批量销毁对应通道，避免监听器累积导致内存泄漏。
 */
const channelRegistry = new Map<string, UniEventChannel>()

/**
 * 注册通道到注册表
 *
 * 同一 navId 仅保留首次注册的通道实例，后续注册会被忽略。
 *
 * @param navId - 导航 ID
 * @param channel - 通道实例
 */
export function registerChannel(navId: string, channel: UniEventChannel): void {
	if (!channelRegistry.has(navId)) {
		channelRegistry.set(navId, channel)
	}
}

/**
 * 获取已注册的通道
 *
 * 供 usePageChannel() 复用同一 navId 对应的通道实例。
 *
 * @param navId - 导航 ID
 * @returns 通道实例，未注册时返回 undefined
 */
export function getRegisteredChannel(navId: string): UniEventChannel | undefined {
	return channelRegistry.get(navId)
}

/**
 * 销毁并移除通道
 *
 * 页面卸载时调用，清理该 navId 对应的所有事件监听器。
 *
 * @param navId - 导航 ID
 */
export function destroyChannel(navId: string): void {
	const channel = channelRegistry.get(navId)
	if (channel) {
		channel.destroy()
		channelRegistry.delete(navId)
	}
}

/**
 * 判断指定 navId 是否有已注册的通道
 *
 * @param navId - 导航 ID
 * @returns 已注册时返回 true
 */
export function hasChannel(navId: string): boolean {
	return channelRegistry.has(navId)
}

/**
 * 获取或创建通道
 *
 * 供 usePageChannel() 使用：同一 navId 复用已注册通道，未注册时创建新通道。
 *
 * @param navId - 导航 ID
 * @returns 通道实例
 */
export function getOrCreateChannel(navId: string): EventChannel {
	let channel = channelRegistry.get(navId)
	if (!channel) {
		channel = new UniEventChannel(navId)
		channelRegistry.set(navId, channel)
	}
	return channel
}
