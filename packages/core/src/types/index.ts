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
	QueryValue,
	ParamValue,
	ParamObject,
	ParamsInput
} from './route'
export { DEFAULT_ANIMATION_DURATION } from './route'

export type { NavigationGuardReturn, NavigationRedirectMode, NavigationRedirect, NavigationGuard, PostNavigationGuard, RouteLeaveGuard, BackGuardReturn, BackGuard } from './guard'

export type { RouterOnError, RouterOptions, Router, GuardRouteOptions, AppRouterOptions, SideSlipGesture } from './router'

export type { RouterError, UniApiCause, UniApiError, NavigationFailure } from './error'

export { RouterErrorCode } from './error'

export type { RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext } from '@/plugin'
