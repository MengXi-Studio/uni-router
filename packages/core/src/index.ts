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
	NavigationGuard,
	PostNavigationGuard,
	RouterOnError,
	RouterOptions,
	Router,
	QueryValue
} from '@/types'
export { RouterError, NavigationFailure } from '@/errors'
export { RouterErrorCode, DEFAULT_ANIMATION_DURATION } from '@/types'
