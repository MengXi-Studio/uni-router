import { inject, onBeforeUnmount, computed, onUnmounted, ref } from 'vue';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/constants/defaults.ts
var DEFAULT_ANIMATION_DURATION = 300;
var DEFAULT_GUARD_TIMEOUT = 1e4;
var DEFAULT_READY_TIMEOUT = 0;
var MAX_REDIRECT_DEPTH = 10;

// src/constants/keys.ts
var NAV_ID_KEY = "__nav_id";
var PARAMS_KEY = "__params_key";
var PARAMS_STORAGE_PREFIX = "__uni_router_params__";
var NAV_EVENT_PREFIX = "uni-router";

// src/constants/router.ts
var ROUTER_SYMBOL = /* @__PURE__ */ Symbol("uni-router");

// src/constants/interceptor.ts
var INTERCEPTED_APIS = ["navigateTo", "redirectTo", "switchTab", "reLaunch", "navigateBack"];

// src/utils/path.ts
function buildFullPath(path, query) {
  const keys = Object.keys(query);
  if (keys.length === 0) return path;
  keys.sort();
  const qs = keys.filter((key) => query[key] !== void 0 && query[key] !== null).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`).join("&");
  return qs ? `${path}?${qs}` : path;
}
function parseQuery(queryString) {
  const query = {};
  if (!queryString) return query;
  const search = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  if (!search) return query;
  for (const pair of search.split("&")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      if (pair) query[decodeURIComponent(pair)] = "";
      continue;
    }
    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    if (key) {
      query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  }
  return query;
}
function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

// src/utils/route.ts
function injectQueryKey(location, key, value) {
  if (typeof location === "string") {
    const queryIndex = location.indexOf("?");
    if (queryIndex === -1) {
      return { path: location, query: { [key]: value } };
    }
    const path = location.slice(0, queryIndex);
    const existingQuery = parseQuery(location.slice(queryIndex + 1));
    return { path, query: { ...existingQuery, [key]: value } };
  }
  if ("path" in location) {
    const pathLoc = location;
    return {
      ...pathLoc,
      query: { ...pathLoc.query, [key]: value }
    };
  }
  if ("name" in location) {
    const namedLoc = location;
    return {
      ...namedLoc,
      query: { ...namedLoc.query, [key]: value }
    };
  }
  return location;
}
function extractQueryKey(location, key) {
  if (typeof location === "string") return void 0;
  if (typeof location === "object" && "query" in location) {
    const query = location.query;
    return query?.[key];
  }
  return void 0;
}

// src/utils/general.ts
function warn(message) {
  if (typeof console !== "undefined") {
    console.warn(`[uni-router] ${message}`);
  }
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function safeGetCurrentPages() {
  if (typeof getCurrentPages !== "function") return [];
  return getCurrentPages();
}

// src/utils/id.ts
function generateRandomId(prefix) {
  const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  return `${prefix}${hex}`;
}
var seq = 0;
function generateUniqueId(prefix) {
  return `${prefix}${Date.now()}-${++seq}`;
}

// src/plugins/params/helpers/index.ts
function isPageInStack(key) {
  const pages = safeGetCurrentPages();
  const encodedKey = encodeURIComponent(key);
  return pages.some((page) => {
    const fullPath = page.$page?.fullPath ?? "";
    return fullPath.includes(`${PARAMS_KEY}=${encodedKey}`);
  });
}

// src/plugins/params/params-manager.ts
function createParamsManager(defaultPersistent) {
  const memoryMap = /* @__PURE__ */ new Map();
  let currentDefaultPersistent = defaultPersistent;
  function setDefaultPersistent(persistent) {
    currentDefaultPersistent = persistent;
  }
  function set(params, persistent) {
    const useStorage = persistent ?? currentDefaultPersistent;
    const key = generateRandomId("pk_");
    try {
      JSON.stringify(params);
    } catch {
      warn("params must be JSON-serializable. Non-serializable values will be lost.");
    }
    if (useStorage) {
      try {
        uni.setStorageSync(PARAMS_STORAGE_PREFIX + key, JSON.stringify(params));
      } catch {
        warn("Failed to write params to storage, falling back to memory storage.");
        memoryMap.set(key, params);
      }
    } else {
      memoryMap.set(key, params);
    }
    return key;
  }
  function get(key) {
    if (memoryMap.has(key)) {
      if (!isPageInStack(key)) {
        memoryMap.delete(key);
        return void 0;
      }
      return memoryMap.get(key);
    }
    try {
      const raw = uni.getStorageSync(PARAMS_STORAGE_PREFIX + key);
      if (raw) {
        if (!isPageInStack(key)) {
          uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key);
          return void 0;
        }
        try {
          return JSON.parse(raw);
        } catch {
          uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key);
          return void 0;
        }
      }
    } catch {
    }
    return void 0;
  }
  function peek(key) {
    if (memoryMap.has(key)) {
      return memoryMap.get(key);
    }
    try {
      const raw = uni.getStorageSync(PARAMS_STORAGE_PREFIX + key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return void 0;
        }
      }
    } catch {
    }
    return void 0;
  }
  function remove(key) {
    memoryMap.delete(key);
    try {
      uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key);
    } catch {
    }
  }
  function cleanupStale() {
    for (const key of memoryMap.keys()) {
      if (!isPageInStack(key)) {
        memoryMap.delete(key);
      }
    }
    try {
      const info = uni.getStorageInfoSync();
      for (const k of info.keys) {
        if (k.startsWith(PARAMS_STORAGE_PREFIX)) {
          const paramsKey = k.slice(PARAMS_STORAGE_PREFIX.length);
          if (!isPageInStack(paramsKey)) {
            uni.removeStorageSync(k);
          }
        }
      }
    } catch {
    }
  }
  function cleanupAll() {
    memoryMap.clear();
    try {
      const info = uni.getStorageInfoSync();
      for (const k of info.keys) {
        if (k.startsWith(PARAMS_STORAGE_PREFIX)) {
          uni.removeStorageSync(k);
        }
      }
    } catch {
    }
  }
  return { set, get, peek, remove, cleanupStale, cleanupAll, setDefaultPersistent };
}

// src/plugins/params/index.ts
var PLUGIN_DATA_KEY = "params";
function enrichLocationWithParams(location, paramsManager) {
  if (typeof location === "string") return location;
  const loc = location;
  const hasParams = "params" in loc && loc.params;
  if (!hasParams || Object.keys(loc.params).length === 0) return location;
  const params = loc.params;
  const persistent = "persistent" in loc ? loc.persistent : void 0;
  const key = paramsManager.set(params, persistent);
  return injectQueryKey(location, PARAMS_KEY, key);
}
function extractParamsKey(location) {
  return extractQueryKey(location, PARAMS_KEY);
}
var ParamsPlugin = {
  name: "params",
  install(context, options) {
    const paramsManager = context.paramsManager;
    const persistent = options.paramsPersistent ?? false;
    if (persistent) {
      paramsManager.setDefaultPersistent(persistent);
    }
    context.onEnrichLocation((location) => {
      return enrichLocationWithParams(location, paramsManager);
    });
    context.onAfterResolve((enrichedLocation, pluginData) => {
      const paramsKey = extractParamsKey(enrichedLocation);
      if (paramsKey) {
        pluginData[PLUGIN_DATA_KEY] = { paramsKey };
      }
    });
    context.onPrepareNavigation((ctx) => {
      const data = ctx.pluginData[PLUGIN_DATA_KEY];
      if (data?.paramsKey) {
        ctx.query[PARAMS_KEY] = data.paramsKey;
      }
    });
    context.onRouteSync((query, params) => {
      const paramsKey = query[PARAMS_KEY];
      if (paramsKey) {
        const resolved = paramsManager.peek(decodeURIComponent(paramsKey));
        if (resolved) {
          Object.assign(params, resolved);
        }
        delete query[PARAMS_KEY];
      }
    });
  }
};

// src/plugins/animation/index.ts
var PLUGIN_DATA_KEY2 = "animation";
function extractAnimation(location) {
  if (typeof location === "string") return void 0;
  if (typeof location === "object" && "animation" in location) return location.animation;
  return void 0;
}
var AnimationPlugin = {
  name: "animation",
  install(context, _options) {
    context.onAfterResolve((enrichedLocation, pluginData) => {
      const animation = extractAnimation(enrichedLocation);
      if (animation) {
        pluginData[PLUGIN_DATA_KEY2] = { animation };
      }
    });
    context.onPrepareNavigation((ctx) => {
      const data = ctx.pluginData[PLUGIN_DATA_KEY2];
      if (data?.animation) {
        ctx.options.animation = data.animation;
      }
    });
  }
};

// src/plugins/channel/uni-event-channel.ts
function wrapEventName(navId, event) {
  return `${NAV_EVENT_PREFIX}:${navId}:${event}`;
}
var UniEventChannel = class {
  constructor(navId) {
    __publicField(this, "navId");
    /** 按 event 名分组的监听器集合，用于 destroy 时批量清理 */
    __publicField(this, "listeners", /* @__PURE__ */ new Map());
    /** 粘性事件缓存：无监听器时 emit 的事件参数，on/once 注册时异步触发 */
    __publicField(this, "pendingEvents", /* @__PURE__ */ new Map());
    __publicField(this, "destroyed", false);
    this.navId = navId;
  }
  on(event, callback) {
    if (this.destroyed) return this;
    const name = wrapEventName(this.navId, event);
    let set = this.listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.listeners.set(event, set);
    }
    set.add(callback);
    uni.$on(name, callback);
    const pending = this.pendingEvents.get(event);
    if (pending) {
      Promise.resolve().then(() => callback(...pending));
    }
    return this;
  }
  once(event, callback) {
    if (this.destroyed) return this;
    const name = wrapEventName(this.navId, event);
    const wrapper = (...args) => {
      this.listeners.get(event)?.delete(wrapper);
      callback(...args);
    };
    let set = this.listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.listeners.set(event, set);
    }
    set.add(wrapper);
    uni.$once(name, wrapper);
    const pending = this.pendingEvents.get(event);
    if (pending) {
      Promise.resolve().then(() => {
        uni.$off(name, wrapper);
        wrapper(...pending);
      });
    }
    return this;
  }
  off(event, callback) {
    const name = wrapEventName(this.navId, event);
    const set = this.listeners.get(event);
    if (callback) {
      uni.$off(name, callback);
      set?.delete(callback);
    } else if (set) {
      set.forEach((cb) => uni.$off(name, cb));
      set.clear();
    }
    return this;
  }
  emit(event, ...args) {
    if (this.destroyed) return this;
    this.pendingEvents.set(event, args);
    const set = this.listeners.get(event);
    if (set && set.size > 0) {
      const name = wrapEventName(this.navId, event);
      uni.$emit(name, ...args);
    }
    return this;
  }
  /**
   * 销毁通道，清理所有监听器和待处理事件
   *
   * 框架内部在页面卸载时调用，防止监听器累积导致内存泄漏。
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const [event, set] of this.listeners) {
      const name = wrapEventName(this.navId, event);
      set.forEach((cb) => uni.$off(name, cb));
      set.clear();
    }
    this.listeners.clear();
    this.pendingEvents.clear();
  }
};
var noopChannel = {
  on: () => noopChannel,
  once: () => noopChannel,
  off: () => noopChannel,
  emit: () => noopChannel
};

// src/plugins/channel/registry.ts
var channelRegistry = /* @__PURE__ */ new Map();
function registerChannel(navId, channel) {
  if (!channelRegistry.has(navId)) {
    channelRegistry.set(navId, channel);
  }
}
function destroyChannel(navId) {
  const channel = channelRegistry.get(navId);
  if (channel) {
    channel.destroy();
    channelRegistry.delete(navId);
  }
}
function getOrCreateChannel(navId) {
  let channel = channelRegistry.get(navId);
  if (!channel) {
    channel = new UniEventChannel(navId);
    channelRegistry.set(navId, channel);
  }
  return channel;
}

// src/enums/router-error-code.ts
var RouterErrorCode = /* @__PURE__ */ ((RouterErrorCode2) => {
  RouterErrorCode2["NAVIGATION_ABORTED"] = "NAVIGATION_ABORTED";
  RouterErrorCode2["NAVIGATION_CANCELLED"] = "NAVIGATION_CANCELLED";
  RouterErrorCode2["NAVIGATION_DUPLICATED"] = "NAVIGATION_DUPLICATED";
  RouterErrorCode2["ROUTE_NOT_FOUND"] = "ROUTE_NOT_FOUND";
  RouterErrorCode2["NAVIGATION_API_ERROR"] = "NAVIGATION_API_ERROR";
  RouterErrorCode2["PLUGIN_REQUIRED"] = "PLUGIN_REQUIRED";
  RouterErrorCode2["SETUP_ERROR"] = "SETUP_ERROR";
  return RouterErrorCode2;
})(RouterErrorCode || {});

// src/errors/router-error.ts
var RouterError = class extends Error {
  /**
   * @param code - 错误码
   * @param message - 错误信息（会自动添加 [uni-router] 前缀）
   */
  constructor(code, message) {
    super(`[uni-router] ${message}`);
    /** 错误码 */
    __publicField(this, "code");
    this.name = "RouterError";
    this.code = code;
  }
};

// src/errors/navigation-failure.ts
var NavigationFailure = class extends RouterError {
  /**
   * @param to - 目标路由
   * @param from - 来源路由
   * @param code - 错误码
   * @param message - 可选的错误信息，默认自动生成
   * @param cause - 原始错误原因
   */
  constructor(to, from, code, message, cause) {
    super(code, message ?? `Navigation failed from "${from.fullPath}" to "${to.fullPath}"`);
    /** 目标路由 */
    __publicField(this, "to");
    /** 来源路由 */
    __publicField(this, "from");
    /** 原始错误原因 */
    __publicField(this, "cause");
    this.name = "NavigationFailure";
    this.to = to;
    this.from = from;
    this.cause = cause;
  }
};

// src/errors/uni-api-error.ts
var UniApiError = class extends Error {
  /**
   * @param api - 失败的 uni API 名称
   * @param cause - 原始错误对象
   */
  constructor(api, cause) {
    super(`[uni-router] uni.${api} failed`);
    /** 调用失败的 API 名称（如 navigateTo / redirectTo） */
    __publicField(this, "api");
    /** 原始错误原因 */
    __publicField(this, "cause");
    this.name = "UniApiError";
    this.api = api;
    this.cause = cause;
  }
};
function isUniApiError(error) {
  return error instanceof UniApiError;
}

// src/errors/is-navigation-failure.ts
function isNavigationFailure(error, code) {
  return error instanceof NavigationFailure && (code ? error.code === code : true);
}

// src/composables/router.ts
function useRouter() {
  let router;
  try {
    router = inject(ROUTER_SYMBOL);
  } catch {
    throw new RouterError("SETUP_ERROR" /* SETUP_ERROR */, "useRouter() must be called inside setup() of a Vue component");
  }
  if (!router) {
    throw new RouterError("SETUP_ERROR" /* SETUP_ERROR */, "useRouter() requires router.install(app) to be called first");
  }
  return router;
}
var reactiveRouteMap = /* @__PURE__ */ new WeakMap();
function getReactiveRoute(router) {
  let routeRef = reactiveRouteMap.get(router);
  if (routeRef) return routeRef;
  routeRef = ref(router.currentRoute);
  reactiveRouteMap.set(router, routeRef);
  router.onRouteChange((to) => {
    routeRef.value = to;
  });
  return routeRef;
}
function useRoute() {
  const router = useRouter();
  return getReactiveRoute(router);
}
function onBeforeRouteLeave(guard) {
  const router = useRouter();
  const route = useRoute();
  const fromPath = route.value.path;
  const remove = router.beforeEach((to, from) => {
    if (from.path !== fromPath) return;
    return guard(to, from);
  });
  onBeforeUnmount(remove);
}
function useLink(options) {
  const router = useRouter();
  const currentRoute = useRoute();
  const route = computed(() => router.resolve(options.to));
  const href = computed(() => route.value.fullPath);
  const isActive = computed(() => currentRoute.value.path === route.value.path);
  const isExactActive = computed(() => currentRoute.value.fullPath === route.value.fullPath);
  async function navigate() {
    if (options.relaunch) {
      return router.relaunch(options.to);
    } else if (options.replace) {
      return router.replace(options.to);
    }
    return router.push(options.to);
  }
  return { route, href, isActive, isExactActive, navigate };
}
var PLUGIN_DATA_KEY3 = "channel";
function extractEvents(location) {
  if (typeof location === "string") return void 0;
  if (typeof location === "object" && "events" in location) return location.events;
  return void 0;
}
function enrichLocationWithNavId(location, navId) {
  return injectQueryKey(location, NAV_ID_KEY, navId);
}
function extractNavId(location) {
  return extractQueryKey(location, NAV_ID_KEY);
}
var ChannelPlugin = {
  name: "channel",
  install(context, options) {
    const useUniEventChannel = options.useUniEventChannel ?? false;
    if (useUniEventChannel) {
      context.onEnrichLocation((location) => {
        const navId = generateUniqueId("nav-");
        return enrichLocationWithNavId(location, navId);
      });
    }
    context.onAfterResolve((enrichedLocation, pluginData) => {
      if (!useUniEventChannel) return;
      const navId = extractNavId(enrichedLocation);
      if (!navId) return;
      const events = extractEvents(enrichedLocation);
      const internalChannel = new UniEventChannel(navId);
      if (events) {
        for (const [event, handler] of Object.entries(events)) {
          internalChannel.on(event, handler);
        }
      }
      registerChannel(navId, internalChannel);
      pluginData[PLUGIN_DATA_KEY3] = { navId, internalChannel, events };
    });
    context.onPrepareNavigation((ctx) => {
      const data = ctx.pluginData[PLUGIN_DATA_KEY3];
      if (!data) return;
      if (data.navId) {
        ctx.query[NAV_ID_KEY] = data.navId;
      }
      if (useUniEventChannel) {
        ctx.options.events = void 0;
      }
      if (data.events && ctx.mode !== "push" && !useUniEventChannel) {
        warn(`uni.${ctx.mode === "replace" ? "redirectTo" : "reLaunch"} does not support events. The events option will be ignored.`);
      }
    });
    context.onCompleteNavigation((ctx) => {
      const data = ctx.pluginData[PLUGIN_DATA_KEY3];
      if (!data) return;
      if (useUniEventChannel && data.internalChannel) {
        ctx.result.eventChannel = data.internalChannel;
      }
    });
    context.onNavigationAbort((pluginData) => {
      const data = pluginData[PLUGIN_DATA_KEY3];
      if (data?.navId) {
        destroyChannel(data.navId);
      }
    });
    context.onRouteSync((query, params) => {
      const navId = query[NAV_ID_KEY];
      if (navId) {
        params.__navId = decodeURIComponent(navId);
        delete query[NAV_ID_KEY];
      }
    });
  }
};
function usePageChannel() {
  const router = useRouter();
  const route = getReactiveRoute(router);
  const navId = route.value.params?.__navId;
  if (!navId) return noopChannel;
  const channel = getOrCreateChannel(navId);
  onUnmounted(() => {
    destroyChannel(navId);
  });
  return channel;
}

// src/utils/platform.ts
var cached = null;
function getPlatform() {
  if (cached) return cached;
  let uniPlatform = "";
  let osName = "";
  try {
    const info = uni.getSystemInfoSync();
    uniPlatform = info.uniPlatform ?? "";
    osName = info.osName ?? info.platform ?? "";
  } catch {
  }
  const isApp = uniPlatform === "app" || uniPlatform === "app-harmony" || uniPlatform === "" && typeof plus !== "undefined";
  const isH5 = uniPlatform === "web" || uniPlatform === "" && typeof window !== "undefined" && typeof document !== "undefined";
  cached = {
    isApp,
    isH5,
    isMp: uniPlatform.startsWith("mp-"),
    isIOS: osName === "ios",
    isAndroid: osName === "android",
    uniPlatform,
    osName
  };
  return cached;
}

// src/utils/query.ts
function serializeQueryValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
function serializeQuery(query) {
  if (!query) return {};
  const result = {};
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value !== void 0 && value !== null) {
      result[key] = serializeQueryValue(value);
    }
  }
  return result;
}
function isSameQuery(a, b) {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  if (keysA.length === 0) return true;
  return keysA.every((key) => a[key] === b[key]);
}
function createRouteLocation(base) {
  const query = Object.freeze(base.query);
  const params = base.params ? Object.freeze({ ...base.params }) : Object.freeze({});
  return {
    path: base.path,
    name: base.name,
    meta: Object.freeze({ ...base.meta }),
    query,
    params,
    fullPath: base.fullPath,
    ...base._synced !== void 0 && { _synced: base._synced },
    queryInt(key, defaultValue) {
      const val = query[key];
      if (val === void 0 || val === "") return defaultValue;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    queryNumber(key, defaultValue) {
      const val = query[key];
      if (val === void 0 || val === "") return defaultValue;
      const parsed = Number(val);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    queryBool(key, defaultValue) {
      const val = query[key];
      if (val === void 0) return defaultValue;
      if (val === "true" || val === "1") return true;
      if (val === "false" || val === "0") return false;
      return defaultValue;
    }
  };
}
function createStartLocation() {
  return createRouteLocation({
    path: "/",
    meta: {},
    query: {},
    fullPath: "/"
  });
}

// src/plugins/interceptor/helpers/parse.ts
function parseUniUrl(url) {
  if (!url) return { path: "", query: {} };
  const queryIndex = url.indexOf("?");
  const rawPath = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? "" : url.slice(queryIndex + 1);
  const path = normalizePath(rawPath);
  const query = queryString ? parseQuery(queryString) : {};
  return { path, query };
}
function extractAnimationFromArgs(args) {
  if (!args.animationType) return void 0;
  return { type: args.animationType, ...args.animationDuration != null && { duration: args.animationDuration } };
}
function buildLocation(path, query, animation, events) {
  const hasQuery = query && Object.keys(query).length > 0;
  if (!hasQuery && !animation && !events) return path;
  return { path, ...hasQuery && { query }, ...animation && { animation }, ...events && { events } };
}

// src/plugins/interceptor/install.ts
function isWebPlatform() {
  return getPlatform().isH5;
}
var InterceptorManager = class {
  constructor() {
    /** 路由器内部发起的 uni API 调用计数器，用于区分路由器调用和外部调用 */
    __publicField(this, "routerCallCount", 0);
    /** 路由器实例引用 */
    __publicField(this, "router", null);
  }
  /**
   * 标记下一次 uni API 调用由路由器内部发起
   *
   * 在调用 uni.navigateTo 等方法前调用，拦截器检测到此标记后放行。
   * 使用计数器而非布尔值，避免并发导航时标记被错误消费。
   */
  markRouterCall() {
    this.routerCallCount++;
  }
  /**
   * 检查当前调用是否由路由器内部发起，若是则消费计数并放行
   */
  isRouterCall() {
    if (this.routerCallCount > 0) {
      this.routerCallCount--;
      return true;
    }
    return false;
  }
  /**
   * 获取路由器实例
   */
  getRouter() {
    return this.router;
  }
  /**
   * 设置路由器实例
   */
  setRouter(router) {
    this.router = router;
  }
  /**
   * 重置所有状态
   */
  reset() {
    this.router = null;
    this.routerCallCount = 0;
  }
};
var activeManager = null;
function markRouterCall() {
  activeManager?.markRouterCall();
}
function handleInterceptedNavigation(api, args) {
  const router = activeManager?.getRouter();
  if (!router) return false;
  switch (api) {
    case "navigateTo": {
      const { path, query } = parseUniUrl(args.url || "");
      if (path) {
        const events = args.events;
        router.push(buildLocation(path, query, extractAnimationFromArgs(args), events));
      }
      break;
    }
    case "redirectTo": {
      const { path, query } = parseUniUrl(args.url || "");
      if (path) {
        router.replace(buildLocation(path, query));
      }
      break;
    }
    case "switchTab": {
      const { path } = parseUniUrl(args.url || "");
      if (path) {
        router.push(path);
      }
      break;
    }
    case "reLaunch": {
      const { path, query } = parseUniUrl(args.url || "");
      if (path) {
        router.relaunch(buildLocation(path, query));
      }
      break;
    }
    case "navigateBack": {
      router.back(args.delta || 1, extractAnimationFromArgs(args));
      break;
    }
  }
  return false;
}
function handleWebSwitchTab(args) {
  const router = activeManager?.getRouter();
  if (!router) return args;
  const originalSuccess = args.success;
  args.success = function(res) {
    router.syncRoute();
    if (typeof originalSuccess === "function") {
      originalSuccess(res);
    }
  };
  return args;
}
function installInterceptors(router) {
  if (typeof uni.addInterceptor !== "function") {
    console.warn("[uni-router] uni.addInterceptor is not available, interceptUniApi option will be ignored");
    return;
  }
  if (activeManager) {
    console.warn("[uni-router] Another router instance has already installed interceptors. Replacing with the new instance. Only one router instance with interceptUniApi is supported.");
    removeInterceptors();
  }
  activeManager = new InterceptorManager();
  activeManager.setRouter(router);
  for (const api of INTERCEPTED_APIS) {
    uni.addInterceptor(api, {
      invoke(args) {
        if (activeManager?.isRouterCall()) {
          return args;
        }
        if (api === "switchTab" && isWebPlatform()) {
          return handleWebSwitchTab(args);
        }
        const result = handleInterceptedNavigation(api, args);
        if ("url" in args) args.url = "";
        return result;
      }
    });
  }
}
function removeInterceptors() {
  if (typeof uni.removeInterceptor === "function") {
    for (const api of INTERCEPTED_APIS) {
      uni.removeInterceptor(api);
    }
  }
  if (activeManager) {
    activeManager.reset();
    activeManager = null;
  }
}

// src/plugins/interceptor/index.ts
var InterceptorPlugin = {
  name: "interceptor",
  install(context, options) {
    const interceptUniApi = options.interceptUniApi ?? false;
    if (!interceptUniApi) return;
    installInterceptors(context.router);
    context.onAppInstall((app) => {
      if (typeof app.onUnmount === "function") {
        app.onUnmount(() => removeInterceptors());
      }
    });
  }
};

export { AnimationPlugin, ChannelPlugin, DEFAULT_ANIMATION_DURATION, DEFAULT_GUARD_TIMEOUT, DEFAULT_READY_TIMEOUT, InterceptorPlugin, MAX_REDIRECT_DEPTH, NavigationFailure, PARAMS_KEY, ParamsPlugin, ROUTER_SYMBOL, RouterError, RouterErrorCode, UniApiError, UniEventChannel, __publicField, buildFullPath, createParamsManager, createRouteLocation, createStartLocation, getPlatform, isNavigationFailure, isObject, isSameQuery, isUniApiError, markRouterCall, noopChannel, normalizePath, onBeforeRouteLeave, parseQuery, safeGetCurrentPages, serializeQuery, useLink, usePageChannel, useRoute, useRouter, warn };
