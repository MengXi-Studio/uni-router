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
 * 内部全局事件总线
 *
 * 独立于 uni.$emit/$on 实现，确保跨平台（H5/App/小程序）行为一致。
 * uni.$emit 在 H5 平台可能存在时机或兼容性差异，使用自定义总线更可靠。
 * 所有通道实例共享同一个总线，通过 wrapEventName 隔离不同 navId 的事件。
 */
class InternalEventBus {
	private listeners: Map<string, Set<(...args: any[]) => void>> = new Map()

	on(event: string, callback: (...args: any[]) => void): void {
		let set = this.listeners.get(event)
		if (!set) {
			set = new Set()
			this.listeners.set(event, set)
		}
		set.add(callback)
	}

	once(event: string, callback: (...args: any[]) => void): void {
		const wrapper = (...args: any[]) => {
			this.off(event, wrapper)
			callback(...args)
		}
		this.on(event, wrapper)
	}

	off(event: string, callback?: (...args: any[]) => void): void {
		if (callback) {
			this.listeners.get(event)?.delete(callback)
		} else {
			this.listeners.delete(event)
		}
	}

	emit(event: string, ...args: any[]): void {
		const set = this.listeners.get(event)
		if (set) {
			// 复制一份，避免回调中修改 Set 导致迭代异常
			;[...set].forEach(cb => cb(...args))
		}
	}
}

/** 全局唯一事件总线实例 */
const globalEventBus = new InternalEventBus()

/**
 * 基于全局事件总线的页面间通信通道
 *
 * 实现与 uni.navigateTo 原生 eventChannel 相同的 EventChannel 接口，
 * 但通过内部事件总线通信，使所有导航方法（push/replace/relaunch/back/switchTab）都支持页面通信。
 *
 * 事件名通过 `uni-router:<navId>:<event>` 格式隔离，避免全局事件冲突。
 *
 * 粘性事件缓存：emit 时若当前通道无监听器，将事件参数缓存；on/once 注册监听器时若有缓存，
 * 立即异步触发。解决导航方 emit 与目标页面 setup 注册监听器的时序竞争问题
 *（uni.navigateTo success 回调可能在目标页面 setup 之前触发，导致 emit 的事件丢失）。
 * 每个事件名仅缓存最后一次 emit 的参数，避免无限堆积。
 */
export class UniEventChannel implements EventChannel {
	private readonly navId: string
	/** 按 event 名分组的监听器集合，用于 destroy 时批量清理 */
	private readonly listeners: Map<string, Set<(...args: any[]) => void>> = new Map()
	/** 粘性事件缓存：无监听器时 emit 的事件参数，on/once 注册时异步触发 */
	private readonly pendingEvents: Map<string, any[]> = new Map()
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
		globalEventBus.on(name, callback)

		// 有缓存的待处理事件时，异步触发（微任务，确保 on 调用链完成后再回调）
		const pending = this.pendingEvents.get(event)
		if (pending) {
			this.pendingEvents.delete(event)
			Promise.resolve().then(() => callback(...pending))
		}

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
		globalEventBus.once(name, wrapper)

		// 有缓存的待处理事件时，异步触发（once 只触发一次）
		const pending = this.pendingEvents.get(event)
		if (pending) {
			this.pendingEvents.delete(event)
			Promise.resolve().then(() => wrapper(...pending))
		}

		return this
	}

	off(event: string, callback?: (...args: any[]) => void): EventChannel {
		const name = wrapEventName(this.navId, event)
		const set = this.listeners.get(event)
		if (callback) {
			globalEventBus.off(name, callback)
			set?.delete(callback)
		} else if (set) {
			// 未指定回调时移除该事件的所有监听器
			set.forEach(cb => globalEventBus.off(name, cb))
			set.clear()
		}
		return this
	}

	emit(event: string, ...args: any[]): EventChannel {
		if (this.destroyed) return this

		const set = this.listeners.get(event)
		// 无监听器时缓存事件，等待 on/once 注册时触发
		if (!set || set.size === 0) {
			this.pendingEvents.set(event, args)
			return this
		}

		const name = wrapEventName(this.navId, event)
		globalEventBus.emit(name, ...args)
		return this
	}

	/**
	 * 销毁通道，清理所有监听器和待处理事件
	 *
	 * 框架内部在页面卸载时调用，防止监听器累积导致内存泄漏。
	 */
	destroy(): void {
		if (this.destroyed) return
		this.destroyed = true
		for (const [event, set] of this.listeners) {
			const name = wrapEventName(this.navId, event)
			set.forEach(cb => globalEventBus.off(name, cb))
			set.clear()
		}
		this.listeners.clear()
		this.pendingEvents.clear()
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
