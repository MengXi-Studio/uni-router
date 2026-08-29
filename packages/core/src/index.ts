export { createRouter } from '@/router'
export { ROUTER_SYMBOL } from '@/constants'
export { useRouter, useRoute, onBeforeRouteLeave, useLink } from '@/composables'

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
	NavigationRedirectMode,
	NavigationRedirect,
	NavigationGuard,
	PostNavigationGuard,
	RouteLeaveGuard,
	BackGuardReturn,
	BackGuard,
	RouterOnError,
	RouterOptions,
	Router,
	GuardRouteOptions,
	AppRouterOptions,
	SideSlipGesture,
	UniApiCause,
	RouterPlugin,
	PluginContext,
	NavigationPrepareContext,
	NavigationCompleteContext
} from '@/types'

// 组合式 API 类型
export type { UseLinkOptions, UseLinkReturn } from '@/composables/link'

// 插件增强的类型（通过模块增强添加到核心类型）
export type { NavigationAnimation, UniAnimationType } from '@/types'

export { RouterError, NavigationFailure, UniApiError, isNavigationFailure } from '@/errors'
export { RouterErrorCode } from '@/enums'
export { DEFAULT_ANIMATION_DURATION } from '@/constants'
