export { createRouter, ROUTER_SYMBOL } from '@/router'
export { useRouter, useRoute } from '@/composables'
export type {
	RouteMeta,
	RouteConfig,
	RouteLocation,
	RouteLocationPathRaw,
	RouteLocationNamedRaw,
	RouteLocationRaw,
	NavigationGuardNext,
	NavigationGuard,
	PostNavigationGuard,
	RouterOnError,
	RouterOptions,
	Router
} from '@/types'
export { RouterError, NavigationFailure } from '@/errors'
export { RouterErrorCode } from '@/types'
