export { createRouter, ROUTER_SYMBOL } from '@/router'
export { useRouter, useRoute, usePageChannel } from '@/composables'
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
	NavigationAnimation,
	UniAnimationType,
	EventChannel,
	EventListeners,
	NavigationResult,
	NavigationId,
	UniEventChannel,
	PageChannel,
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
	UniApiError,
	QueryValue,
	ParamValue,
	ParamObject,
	ParamsInput
} from '@/types'
export { RouterError, NavigationFailure } from '@/errors'
export { RouterErrorCode, DEFAULT_ANIMATION_DURATION } from '@/types'
