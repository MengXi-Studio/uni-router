export { createRouter, ROUTER_SYMBOL } from '@/router'
export { useRouter, useRoute } from '@/composables'

// 插件导出（用户需要引入并注册）
export { ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@/plugins'
export { usePageChannel } from '@/plugins'
export { UniEventChannel, noopChannel } from '@/plugins/channel/uni-event-channel'

// 核心类型
export type {
	RouteNameMap,
	RouteName,
	RoutePath,
	RouteMeta,
	RouteConfig,
	RouteLocation,
	RouteLocationPathRaw,
	RouteLocationNamedRaw,
	RouteLocationRaw,
	QueryValue,
	ParamValue,
	ParamObject,
	ParamsInput,
	EventChannel,
	EventListeners,
	NavigationResult,
	NavigationGuardNext,
	NavigationGuardNextOptions,
	NavigationRedirectMode,
	NavigationGuard,
	PostNavigationGuard,
	RouterOnError,
	RouterOptions,
	Router,
	GuardRouteOptions,
	UniApiCause,
	RouterPlugin,
	PluginContext,
	NavigationPrepareContext,
	NavigationCompleteContext
} from '@/types'

// 插件增强的类型（通过模块增强添加到核心类型）
export type { NavigationAnimation, UniAnimationType } from '@/types'

export { RouterError, NavigationFailure, UniApiError } from '@/errors'
export { RouterErrorCode, DEFAULT_ANIMATION_DURATION } from '@/types'
