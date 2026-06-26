import type {
	RouteConfig,
	RouteLocation,
	RouteLocationRaw,
	NavigationAnimation,
	NavigationResult,
	EventChannel,
	EventListeners,
	UniEventChannel
} from '@/types'
import { RouterErrorCode } from '@/types/error'
import { NavigationFailure, type RouterError } from '@/errors'
import type { GuardResult, GuardManager } from '@/guard'
import type { RouteMatcher } from '@/matcher'
import type { ParamsManager } from '@/params'
import type { ChannelManager } from '@/channel'
import type { createRouteState } from '@/state'
import { navigateTo, replaceTo, relaunchTo, isUniApiError } from '@/navigation'
import { warn } from '@/utils'
import {
	extractAnimation,
	extractEvents,
	injectNavId,
	enrichLocationWithParams,
	isSameRouteLocation
} from './location-processor'

/**
 * 路由状态管理器实例类型（createRouteState 的返回类型）
 */
type RouteState = ReturnType<typeof createRouteState>

/**
 * 导航编排器依赖的上下文
 *
 * UniRouter 实例结构性地满足此接口，将导航编排逻辑与路由器外壳解耦，
 * 仅暴露编排所需的最小成员集合。
 */
export interface NavigationContext {
	/** 是否使用内置通信管理器（false 时使用原生 EventChannel） */
	readonly useUniEventChannel: boolean
	/** 守卫管理器 */
	readonly guardManager: GuardManager
	/** 路由匹配器 */
	readonly matcher: RouteMatcher
	/** 路由状态管理器 */
	readonly routeState: RouteState
	/** 参数管理器 */
	readonly paramsManager: ParamsManager
	/** 通信通道管理器 */
	readonly channelManager: ChannelManager
	/** 当前挂起的导航 Promise，用于并发导航排队 */
	pendingNavigation: Promise<NavigationResult | RouteLocation | void> | null
	/** 触发所有已注册的错误处理器 */
	triggerErrorHandlers(error: RouterError, to: RouteLocation, from: RouteLocation): void
}

/**
 * 最大重定向深度，超过此值将取消导航以防止无限循环
 */
const MAX_REDIRECT_DEPTH = 10

/**
 * 执行导航流程（push / replace / relaunch 的统一入口）
 *
 * 处理并发导航排队、通道创建、params 注入、重复导航检测，
 * 并委托 {@link executeNavigation} 执行完整的守卫链和导航操作。
 *
 * @param ctx - 导航上下文
 * @param location - 目标路由位置
 * @param mode - 导航模式
 * @returns 导航结果（push 模式包含 eventChannel）
 * @throws {NavigationFailure} 导航失败时抛出
 */
export async function performNavigation(
	ctx: NavigationContext,
	location: RouteLocationRaw,
	mode: 'push' | 'replace' | 'relaunch'
): Promise<NavigationResult> {
	// 等待前一次导航完成（无论成功或失败），避免并发导航
	// 错误已通过 onError 机制通知，此处无需再处理
	if (ctx.pendingNavigation) {
		await ctx.pendingNavigation.catch(() => {})
	}

	// 从原始路由位置中提取事件监听器（resolve 会丢弃这些字段）
	const events = extractEvents(location)

	// 启用内置通信管理器时：创建通道并注入 navId 到 location.params
	// navId 随 params 存储（强制 persistent，解决 H5 刷新丢失问题）
	let channel: UniEventChannel | undefined
	let locationForEnrich = location
	if (ctx.useUniEventChannel) {
		const created = ctx.channelManager.createChannel(events)
		channel = created.channel
		locationForEnrich = injectNavId(location, created.navigationId)
	}

	// 在 resolve 前处理 params：存入 ParamsManager 并将 key 注入 location
	const enrichedLocation = enrichLocationWithParams(locationForEnrich, ctx.paramsManager)

	const to = ctx.matcher.resolve(enrichedLocation)
	const from = ctx.routeState.getCurrentRoute()
	// 从原始路由位置中提取动画参数（resolve 会丢弃这些字段）
	const animation = extractAnimation(location)

	// events 仅在 push 模式下有效，其他模式发出警告并忽略
	if (events && mode !== 'push') {
		warn(`uni.${mode === 'replace' ? 'redirectTo' : 'reLaunch'} does not support events. The events option will be ignored.`)
	}

	if (mode === 'push' && isSameRouteLocation(to, from)) {
		// 重复导航：销毁刚创建的通道，避免泄漏
		if (channel) ctx.channelManager.destroyChannel(channel.navigationId)
		const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_DUPLICATED, `Avoided redundant navigation to current location: "${to.fullPath}"`)
		ctx.triggerErrorHandlers(failure, to, from)
		return Promise.reject(failure)
	}

	// 启用管理器时 events 由管理器接管，不传给原生 uni.navigateTo
	const effectiveEvents = ctx.useUniEventChannel ? undefined : (mode === 'push' ? events : undefined)
	const navigationPromise = executeNavigation(ctx, to, from, mode, 0, animation, effectiveEvents)
	ctx.pendingNavigation = navigationPromise

	try {
		const result = await navigationPromise
		// 启用管理器时用管理器 channel 覆盖返回值（替代原生 EventChannel）
		if (ctx.useUniEventChannel && channel) {
			return { ...result, eventChannel: channel }
		}
		return result
	} finally {
		if (ctx.pendingNavigation === navigationPromise) {
			ctx.pendingNavigation = null
		}
	}
}

/**
 * 运行守卫链（beforeEach → beforeEnter → beforeResolve）
 *
 * 统一 back / push / replace / relaunch 的守卫执行逻辑。
 * 每个阶段执行后通过 {@link handleGuardResult} 处理结果（中止/重定向/放行）。
 *
 * @param ctx - 导航上下文
 * @param to - 目标路由
 * @param from - 来源路由
 * @param mode - 导航模式
 * @param redirectDepth - 当前重定向深度
 * @param animation - 导航动画
 * @param events - 事件监听器（仅 push 时生效）
 * @param config - 目标路由配置，传入时执行 beforeEnter，不传时跳过（back 不执行独享守卫）
 * @returns 中止或重定向时返回 Promise，全部放行时返回 null
 */
export async function runGuardChain(
	ctx: NavigationContext,
	to: RouteLocation,
	from: RouteLocation,
	mode: 'push' | 'replace' | 'relaunch' | 'back',
	redirectDepth: number,
	animation?: NavigationAnimation,
	events?: EventListeners,
	config?: RouteConfig
): Promise<NavigationResult | null> {
	// 全局前置守卫
	const beforeResult = await ctx.guardManager.runBeforeGuards(to, from)
	const handled = handleGuardResult(ctx, beforeResult, to, from, mode, redirectDepth, animation, events)
	if (handled) return handled

	// 路由独享守卫（仅当 config 存在时执行，back 跳过）
	if (config) {
		const beforeEnterResult = await ctx.guardManager.runBeforeEnterGuards(to, from, config)
		const handledEnter = handleGuardResult(ctx, beforeEnterResult, to, from, mode, redirectDepth, animation, events)
		if (handledEnter) return handledEnter
	}

	// 全局解析守卫
	const beforeResolveResult = await ctx.guardManager.runBeforeResolveGuards(to, from)
	const handledResolve = handleGuardResult(ctx, beforeResolveResult, to, from, mode, redirectDepth, animation, events)
	if (handledResolve) return handledResolve

	return null
}

/**
 * 执行完整的导航流程，包括守卫链和 uni API 调用
 *
 * 依次执行：全局前置守卫 → 路由独享守卫 → 全局解析守卫 → uni 导航 API → 全局后置钩子。
 * 支持守卫重定向，但重定向深度超过 {@link MAX_REDIRECT_DEPTH} 时将取消导航。
 *
 * @param ctx - 导航上下文
 * @param to - 目标路由
 * @param from - 来源路由
 * @param mode - 导航模式
 * @param redirectDepth - 当前重定向深度
 * @param animation - 导航动画（仅 App 端生效），覆盖 meta.animation
 * @param events - 页面间通信事件监听器（仅 push 时生效）
 * @returns 导航结果（push 模式包含 eventChannel）
 * @throws {NavigationFailure} 导航被中止、取消或 API 调用失败时抛出
 */
export async function executeNavigation(
	ctx: NavigationContext,
	to: RouteLocation,
	from: RouteLocation,
	mode: 'push' | 'replace' | 'relaunch' | 'back',
	redirectDepth: number,
	animation?: NavigationAnimation,
	events?: EventListeners
): Promise<NavigationResult> {
	if (redirectDepth > MAX_REDIRECT_DEPTH) {
		const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_CANCELLED, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`)
		ctx.triggerErrorHandlers(failure, to, from)
		return Promise.reject(failure)
	}

	const config = ctx.matcher.getRouteConfig(to.path)

	// 执行守卫链（传入 config 时执行 beforeEnter）
	const guardResult = await runGuardChain(ctx, to, from, mode, redirectDepth, animation, events, config)
	if (guardResult) return guardResult

	try {
		const navOptions = {
			path: to.path,
			meta: to.meta,
			query: to.query,
			animation,
			events
		}

		let eventChannel: EventChannel | undefined
		if (mode === 'push') {
			eventChannel = await navigateTo(navOptions)
		} else if (mode === 'replace') {
			await replaceTo(navOptions)
		} else {
			await relaunchTo(navOptions)
		}

		ctx.routeState.setCurrentRoute(to)
		ctx.guardManager.runAfterGuards(to, from)

		return { ...to, eventChannel }
	} catch (error) {
		const code = RouterErrorCode.NAVIGATION_API_ERROR
		const cause = isUniApiError(error) ? error : undefined
		const failure = new NavigationFailure(to, from, code, undefined, cause)
		ctx.triggerErrorHandlers(failure, to, from)
		return Promise.reject(failure)
	}
}

/**
 * 处理守卫执行结果
 *
 * 根据守卫返回的结果决定后续行为：
 * - abort: 中止导航并抛出 NavigationFailure
 * - next + redirect: 递归执行重定向导航
 * - next: 继续执行后续守卫
 *
 * 重定向方式优先级：守卫通过 next(location, { mode }) 指定的 mode > 原始导航方式。
 * 原始导航为 back 时无法重定向（目标不在页面栈中），回退为 relaunch。
 *
 * @param ctx - 导航上下文
 * @param result - 守卫执行结果
 * @param to - 目标路由
 * @param from - 来源路由
 * @param mode - 导航模式
 * @param redirectDepth - 当前重定向深度
 * @param animation - 当前导航的动画参数
 * @param events - 当前导航的事件监听器
 * @returns 中止或重定向时返回 Promise，放行时返回 null
 */
export function handleGuardResult(
	ctx: NavigationContext,
	result: GuardResult,
	to: RouteLocation,
	from: RouteLocation,
	mode: 'push' | 'replace' | 'relaunch' | 'back',
	redirectDepth: number,
	animation?: NavigationAnimation,
	events?: EventListeners
): Promise<NavigationResult> | null {
	if (result.type === 'abort') {
		const failure = new NavigationFailure(to, from, result.code)
		ctx.triggerErrorHandlers(failure, to, from)
		return Promise.reject(failure)
	}

	if (result.redirect) {
		// 重定向时提取新位置的动画参数和事件监听器，未指定则沿用当前值
		const redirectAnimation = extractAnimation(result.redirect) ?? animation
		// 启用内置通信管理器时，重定向的 events 由管理器接管，不传给原生
		// 注：重定向目标不会创建新 channel（守卫重定向为异常流程，通信需求低）
		const redirectEvents = ctx.useUniEventChannel ? undefined : (extractEvents(result.redirect) ?? events)
		const redirectTarget = ctx.matcher.resolve(result.redirect)
		// 重定向方式：守卫指定优先，否则沿用原始导航方式
		// back 无法作为重定向方式（目标不在页面栈中），回退为 relaunch
		const redirectMode = result.mode ?? (mode === 'back' ? 'relaunch' : mode)
		return executeNavigation(ctx, redirectTarget, from, redirectMode, redirectDepth + 1, redirectAnimation, redirectEvents)
	}

	return null
}
