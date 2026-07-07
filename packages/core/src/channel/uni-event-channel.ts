import type { EventChannel } from '@/types'

/**
 * URL query 中传递 navigationId 的字段名
 *
 * 类似 __params_key，syncCurrentRoute 会从 query 中读取并移除，不暴露给用户。
 */
export const NAV_ID_KEY = '__nav_id'

/**
 * 生成唯一导航 ID
 *
 * 格式：nav-<时间戳>-<自增序号>，用于隔离每次导航的事件通道
 */
let navIdSeq = 0
export function generateNavId(): string {
	return `nav-${Date.now()}-${++navIdSeq}`
}

/**
 * 包装事件名，加入 navId 前缀以隔离不同导航的事件
 *
 * 格式：uni-router:<navId>:<eventName>
 */
const NAV_EVENT_PREFIX = 'uni-router'
export function wrapEventName(navId: string, event: string): string {
	return `${NAV_EVENT_PREFIX}:${navId}:${event}`
}

/**
 * 基于 uni.$emit/$on/$off 的页面间通信通道
 *
 * 实现与 uni.navigateTo 原生 eventChannel 相同的 EventChannel 接口，
 * 但通过全局事件总线通信，使所有导航方法（push/replace/relaunch/back/switchTab）都支持页面通信。
 *
 * 事件名通过 `uni-router:<navId>:<event>` 格式隔离，避免全局事件冲突。
 */
export class UniEventChannel implements EventChannel {
	private readonly navId: string
	/** 按 event 名分组的监听器集合，用于 destroy 时批量清理 */
	private readonly listeners: Map<string, Set<(...args: any[]) => void>> = new Map()
	private destroyed = false

	constructor(navId: string) {
		this.navId = navId
	}

	on(event: string, callback: (...args: any[]) => void): EventChannel {
		if (this.destroyed) return this
		const name = wrapEventName(this.navId, event)
		let set = this.listeners.get(event)
		if (!set) {
			set = new Set()
			this.listeners.set(event, set)
		}
		set.add(callback)
		uni.$on(name, callback)
		return this
	}

	once(event: string, callback: (...args: any[]) => void): EventChannel {
		if (this.destroyed) return this
		const name = wrapEventName(this.navId, event)
		// 包装回调：触发后从 listeners 中移除，便于 destroy 时正确清理
		const wrapper = (...args: any[]) => {
			this.listeners.get(event)?.delete(wrapper)
			callback(...args)
		}
		let set = this.listeners.get(event)
		if (!set) {
			set = new Set()
			this.listeners.set(event, set)
		}
		set.add(wrapper)
		uni.$once(name, wrapper)
		return this
	}

	off(event: string, callback?: (...args: any[]) => void): EventChannel {
		const name = wrapEventName(this.navId, event)
		const set = this.listeners.get(event)
		if (callback) {
			uni.$off(name, callback)
			set?.delete(callback)
		} else if (set) {
			// 未指定回调时移除该事件的所有监听器
			set.forEach(cb => uni.$off(name, cb))
			set.clear()
		}
		return this
	}

	emit(event: string, ...args: any[]): EventChannel {
		if (this.destroyed) return this
		const name = wrapEventName(this.navId, event)
		uni.$emit(name, ...args)
		return this
	}

	/**
	 * 销毁通道，清理所有监听器
	 *
	 * 框架内部在页面卸载时调用，防止监听器累积导致内存泄漏。
	 */
	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true
		for (const [event, set] of this.listeners) {
			const name = wrapEventName(this.navId, event)
			set.forEach(cb => uni.$off(name, cb))
			set.clear()
		}
		this.listeners.clear()
	}
}

/**
 * 空操作通道
 *
 * 当目标页面无 __nav_id 时由 usePageChannel() 返回，避免调用方需判空。
 */
export const noopChannel: EventChannel = {
	on: () => noopChannel,
	once: () => noopChannel,
	off: () => noopChannel,
	emit: () => noopChannel
}
