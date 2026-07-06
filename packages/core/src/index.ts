export { createRouter, ROUTER_SYMBOL } from '@/router'
export { useRouter, useRoute } from '@/composables'
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
	QueryValue,
	ParamValue,
	ParamObject,
	ParamsInput
} from '@/types'
export { RouterError, NavigationFailure, UniApiError } from '@/errors'
export { RouterErrorCode, DEFAULT_ANIMATION_DURATION } from '@/types'
