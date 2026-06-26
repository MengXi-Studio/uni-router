import type { EventChannel, NavigationId } from '@/types'

/**
 * 基于 uni.$emit / uni.$on / uni.$off 的 EventChannel 实现
 *
 * 与原生 EventChannel 接口完全一致（emit / on / once / off，链式返回），
 * 底层通过 `uni.$emit` 全局事件总线转发，配合唯一 navigationId 隔离通道，
 * 避免不同导航产生的事件串扰。
 *
 * 事件名格式：`uni-router:<navigationId>:<eventName>`
 *
 * 跨平台行为一致（H5 / App / 小程序），仅在调用方注册后导航、目标页面 onLoad 后
 * 通过 `usePageChannel()` 拿到通道，时序由 `ChannelManager` 保证。
 */
export class UniEventChannel implements EventChannel {
	/** 当前通道的导航标识，用于事件名隔离 */
	readonly navigationId: NavigationId
	/**
	 * 是否为接收侧（目标页面）
	 *
	 * 仅用于日志区分，emit/on 行为对称，均通过全局 $emit/$on 转发
	 */
	protected readonly isReceiver: boolean

	/**
	 * @param navigationId - 导航标识
	 * @param isReceiver - 是否为接收侧（目标页面）
	 */
	constructor(navigationId: NavigationId, isReceiver: boolean = false) {
		this.navigationId = navigationId
		this.isReceiver = isReceiver
	}

	/**
	 * 生成隔离后的事件名
	 */
	private eventKey(eventName: string): string {
		return `uni-router:${this.navigationId}:${eventName}`
	}

	/**
	 * 向对端发送事件
	 *
	 * 注：对端尚未通过 `on` 注册监听时，事件将丢失（与原生 EventChannel 行为一致）
	 */
	emit(eventName: string, ...args: unknown[]): this {
		uni.$emit(this.eventKey(eventName), ...args)
		return this
	}

	/**
	 * 监听对端事件
	 *
	 * 同一 eventName 可注册多个 callback，按注册顺序触发
	 */
	on(eventName: string, callback: (...args: unknown[]) => void): this {
		uni.$on(this.eventKey(eventName), callback)
		return this
	}

	/**
	 * 监听一次后自动移除
	 */
	once(eventName: string, callback: (...args: unknown[]) => void): this {
		const wrapper = (...args: unknown[]): void => {
			this.off(eventName, wrapper)
			callback(...args)
		}
		this.on(eventName, wrapper)
		return this
	}

	/**
	 * 取消监听
	 *
	 * 不传 callback 时移除该 eventName 的所有监听器
	 */
	off(eventName: string, callback?: (...args: unknown[]) => void): this {
		if (callback) {
			uni.$off(this.eventKey(eventName), callback)
		} else {
			uni.$off(this.eventKey(eventName))
		}
		return this
	}
}

/**
 * 空操作通道
 *
 * 当无法找到对应 navigationId 时（如 H5 刷新后丢失、用户直接通过 URL 进入、
 * `useUniEventChannel: false` 时目标页面调用 `usePageChannel()`），
 * 返回此实例以实现优雅降级：所有方法静默忽略，不抛错。
 *
 * 避免目标页面因通道缺失而崩溃。
 */
export class NoOpUniEventChannel extends UniEventChannel {
	constructor() {
		super('noop', true)
	}

	emit(): this {
		return this
	}

	on(): this {
		return this
	}

	once(): this {
		return this
	}

	off(): this {
		return this
	}
}
