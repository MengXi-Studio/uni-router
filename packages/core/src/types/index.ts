// 动画类型
export type { NavigationAnimation, UniAnimationType } from './animation'
export { DEFAULT_ANIMATION_DURATION } from './animation'

// 查询参数类型
export type { QueryValue } from './query'

// 页面参数类型
export type { ParamValue, ParamObject, ParamsInput } from './params'

// 事件通道类型
export type { EventChannel, EventListeners, NavigationId, UniEventChannel, PageChannel } from './event-channel'

// 路由位置类型
export type { RouteNameMap, RouteName, RoutePath, RouteMeta, RouteConfig, RouteLocation, RouteLocationPathRaw, RouteLocationNamedRaw, RouteLocationRaw, NavigationResult } from './route-location'

// 守卫类型
export type { NavigationGuardNext, NavigationGuardNextOptions, NavigationRedirectMode, NavigationGuard, PostNavigationGuard } from './guard'

// 路由器类型
export type { RouterOnError, RouterOptions, Router, GuardRouteOptions } from './router'

// 错误类型
export type { RouterError, UniApiCause, UniApiError, NavigationFailure } from './error'

export { RouterErrorCode } from './error'
