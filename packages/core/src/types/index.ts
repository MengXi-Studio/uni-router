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

export type { NavigationGuardNext, NavigationGuardNextOptions, NavigationRedirectMode, NavigationGuard, PostNavigationGuard } from './guard'

export type { RouterOnError, RouterOptions, Router, GuardRouteOptions } from './router'

export type { RouterError, UniApiCause, UniApiError, NavigationFailure } from './error'

export { RouterErrorCode } from './error'

export type { RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext } from '@/plugin'
