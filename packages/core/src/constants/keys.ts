/**
 * URL query 中传递 navigationId 的字段名
 *
 * 由 ChannelPlugin 注入，syncCurrentRoute 会从 query 中读取并移除，不暴露给用户。
 */
export const NAV_ID_KEY = '__nav_id'

/**
 * URL query 中传递 params key 的字段名
 *
 * 由 ParamsPlugin 注入，目标页面通过 key 从 ParamsManager 取出参数。
 */
export const PARAMS_KEY = '__params_key'

/**
 * params 持久化存储 key 前缀
 *
 * ParamsManager 以 `${PARAMS_STORAGE_PREFIX}${key}` 作为 uni.setStorageSync 的存储键。
 */
export const PARAMS_STORAGE_PREFIX = '__uni_router_params__'

/**
 * 内置通信管理器全局事件前缀
 *
 * 事件格式：`${NAV_EVENT_PREFIX}:${navId}:${eventName}`，用于隔离不同导航的事件通道。
 */
export const NAV_EVENT_PREFIX = 'uni-router'
