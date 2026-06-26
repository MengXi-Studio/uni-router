/**
 * 页面间通信事件通道
 *
 * 用于 uni.navigateTo 的 events 参数和 success 回调中的 eventChannel，
 * 实现页面间双向通信。
 *
 * @see https://uniapp.dcloud.net.cn/api/router.html#navigateto
 */
export interface EventChannel {
	/** 监听事件 */
	on(event: string, callback: (...args: any[]) => void): EventChannel
	/** 监听事件（仅触发一次） */
	once(event: string, callback: (...args: any[]) => void): EventChannel
	/** 取消监听事件 */
	off(event: string, callback?: (...args: any[]) => void): EventChannel
	/** 触发事件 */
	emit(event: string, ...args: any[]): EventChannel
}

/**
 * 页面间通信事件监听器
 *
 * 键为事件名称，值为事件处理函数。用于 uni.navigateTo 的 events 参数，
 * 监听目标页面通过 eventChannel.emit 发送的事件。
 */
export type EventListeners = Record<string, (...args: any[]) => void>

/**
 * 内置通信管理器生成的唯一导航标识
 *
 * 用于隔离不同导航产生的事件通道，事件名格式：`uni-router:<navigationId>:<eventName>`。
 * 由 `ChannelManager` 在 `router.push` / `replace` / `relaunch` 时自动生成，
 * 注入到 `route.params.__navId`，目标页面通过 `usePageChannel()` 读取。
 */
export type NavigationId = string

/**
 * 基于 uni.$emit / uni.$on 的内置通信通道
 *
 * 与原生 `EventChannel` 接口完全一致（`emit` / `on` / `once` / `off`，链式返回），
 * 底层通过全局事件总线转发，配合唯一 navigationId 隔离通道。
 *
 * 启用 `useUniEventChannel` 后，`push` / `replace` / `relaunch` 的返回值
 * `eventChannel` 即为此类型实例。
 */
export interface UniEventChannel extends EventChannel {
	/** 当前通道的导航标识 */
	readonly navigationId: NavigationId
}

/**
 * 页面侧通信通道（目标页面通过 `usePageChannel()` 获取）
 *
 * 与 `UniEventChannel` 接口一致，语义为"接收侧"。
 * 无 navigationId 时返回 no-op 实例（优雅降级，不报错）。
 */
export type PageChannel = UniEventChannel
