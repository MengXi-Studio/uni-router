import type { RouterPlugin, PluginContext } from '@/plugin'
import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw, EventChannel, EventListeners, RouterOptions } from '@/types'
import { UniEventChannel, generateNavId, noopChannel, NAV_ID_KEY } from './uni-event-channel'
import { registerChannel, destroyChannel, getOrCreateChannel } from './registry'
import { useRouter, getReactiveRoute } from '@/composables'
import { warn } from '@/utils/general'
import { onUnmounted } from 'vue'

// Re-export implementation code for external use
export { UniEventChannel, generateNavId, wrapEventName, noopChannel, NAV_ID_KEY } from './uni-event-channel'
export { registerChannel, getRegisteredChannel, destroyChannel, hasChannel, getOrCreateChannel } from './registry'

/**
 * ChannelPlugin 插件数据键
 */
const PLUGIN_DATA_KEY = 'channel'

/**
 * 从原始路由位置中提取事件监听器
 */
function extractEvents(location: RouteLocationRaw): EventListeners | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'events' in location) return (location as { events?: EventListeners }).events
	return undefined
}

/**
 * 将 navigationId 注入路由位置的 query 中
 */
function enrichLocationWithNavId(location: RouteLocationRaw, navId: string): RouteLocationRaw {
	if (typeof location === 'string') {
		return { path: location, query: { [NAV_ID_KEY]: navId } }
	}

	if ('path' in location) {
		const pathLoc = location as RouteLocationPathRaw
		return {
			...pathLoc,
			query: { ...pathLoc.query, [NAV_ID_KEY]: navId }
		}
	}

	if ('name' in location) {
		const namedLoc = location as RouteLocationNamedRaw
		return {
			...namedLoc,
			query: { ...namedLoc.query, [NAV_ID_KEY]: navId }
		}
	}

	return location
}

/**
 * 从已注入 navId 的路由位置中提取 __nav_id
 */
function extractNavId(location: RouteLocationRaw): string | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'query' in location) {
		const query = (location as { query?: Record<string, unknown> }).query
		return query?.[NAV_ID_KEY] as string | undefined
	}
	return undefined
}

/**
 * ChannelPlugin - 页面间通信通道插件
 *
 * 提供页面间通信能力：
 * - useUniEventChannel: true 时，所有导航方式都支持页面通信
 * - 基于 uni.$emit/$on 全局事件总线实现
 * - 每次导航生成唯一 navId 隔离事件通道
 * - 目标页面通过 usePageChannel() 获取通道
 */
export const ChannelPlugin: RouterPlugin = {
	name: 'channel',

	install(context: PluginContext, options: RouterOptions) {
		const useUniEventChannel = options.useUniEventChannel ?? false

		// onEnrichLocation: useUniEventChannel 模式下生成 navId 并注入 query
		if (useUniEventChannel) {
			context.onEnrichLocation(location => {
				const navId = generateNavId()
				return enrichLocationWithNavId(location, navId)
			})
		}

		// onAfterResolve: 提取 navId，创建 UniEventChannel，注册 events
		context.onAfterResolve((enrichedLocation, pluginData) => {
			if (!useUniEventChannel) return

			const navId = extractNavId(enrichedLocation)
			if (!navId) return

			const events = extractEvents(enrichedLocation)
			const internalChannel = new UniEventChannel(navId)

			// 注册调用方传入的 events 监听器到内置通道
			if (events) {
				for (const [event, handler] of Object.entries(events)) {
					internalChannel.on(event, handler)
				}
			}

			// 注册到全局 registry，供目标页面 usePageChannel() 复用
			registerChannel(navId, internalChannel)

			pluginData[PLUGIN_DATA_KEY] = { navId, internalChannel, events }
		})

		// onPrepareNavigation: 将 __nav_id 拼入导航 URL query；suppress events
		context.onPrepareNavigation(ctx => {
			const data = ctx.pluginData[PLUGIN_DATA_KEY]
			if (!data) return

			if (data.navId) {
				ctx.query[NAV_ID_KEY] = data.navId
			}

			// useUniEventChannel 模式下不向 uni.navigateTo 传递 events（避免原生通道干扰）
			if (useUniEventChannel) {
				ctx.options.events = undefined
			}

			// 非 useUniEventChannel 模式下 events 仅在 push 模式有效，其他模式发出警告
			if (data.events && ctx.mode !== 'push' && !useUniEventChannel) {
				warn(`uni.${ctx.mode === 'replace' ? 'redirectTo' : 'reLaunch'} does not support events. The events option will be ignored.`)
			}
		})

		// onCompleteNavigation: 返回 internalChannel 替代原生 eventChannel
		context.onCompleteNavigation(ctx => {
			const data = ctx.pluginData[PLUGIN_DATA_KEY]
			if (!data) return

			// useUniEventChannel 模式下返回内置通道，替代原生 eventChannel
			if (useUniEventChannel && data.internalChannel) {
				ctx.result.eventChannel = data.internalChannel
			}
		})

		// onNavigationAbort: 销毁通道
		context.onNavigationAbort(pluginData => {
			const data = pluginData[PLUGIN_DATA_KEY]
			if (data?.navId) {
				destroyChannel(data.navId)
			}
		})

		// onRouteSync: 从 URL query 中提取 __nav_id，写入 params.__navId
		context.onRouteSync((query, params) => {
			const navId = query[NAV_ID_KEY]
			if (navId) {
				params.__navId = decodeURIComponent(navId)
				delete query[NAV_ID_KEY]
			}
		})
	}
}

/**
 * 获取当前页面的通信通道
 *
 * 必须在 Vue 组件的 setup() 函数中调用。
 * 内部自动读取 `route.params.__navId`：
 * - 有 navId 时返回与导航方共享的 EventChannel 实例（基于 uni.$emit/$on）
 * - 无 navId 时返回 no-op channel，避免调用方需判空
 *
 * 页面卸载时自动销毁通道，清理所有事件监听器，防止内存泄漏。
 *
 * 仅在 `createRouter({ useUniEventChannel: true })` 时有效。
 * 默认模式下（useUniEventChannel: false）始终返回 no-op channel。
 *
 * @returns 事件通道实例
 * @throws {RouterError} 在 setup 外调用或未安装路由器时抛出 SETUP_ERROR
 *
 * @example
 * ```ts
 * import { usePageChannel } from '@meng-xi/uni-router'
 *
 * const channel = usePageChannel()
 *
 * // 监听导航方发送的事件
 * channel.on('data', (payload) => {
 *   console.log('received:', payload)
 * })
 *
 * // 向导航方发送事件
 * channel.emit('ready', { status: 'ok' })
 * ```
 */
export function usePageChannel(): EventChannel {
	const router = useRouter()
	const route = getReactiveRoute(router)
	const navId = route.value.params?.__navId as string | undefined

	// 无 navId 时返回 no-op channel，避免调用方需判空
	if (!navId) return noopChannel

	// 获取或创建通道（同一 navId 复用已注册通道）
	const channel = getOrCreateChannel(navId)

	// 页面卸载时销毁通道，清理所有监听器
	onUnmounted(() => {
		destroyChannel(navId)
	})

	return channel
}
