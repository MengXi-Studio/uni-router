import { inject, onUnmounted, ref } from 'vue';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

// src/plugins/params/params-manager.ts
var PARAMS_STORAGE_PREFIX = "__uni_router_params__";
var PARAMS_KEY = "__params_key";
function generateKey() {
  const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  return `pk_${hex}`;
}
function isPageInStack(key) {
  const pages = safeGetCurrentPages();
  const encodedKey = encodeURIComponent(key);
  return pages.some((page) => {
    const fullPath = page.$page?.fullPath ?? "";
    return fullPath.includes(`${PARAMS_KEY}=${encodedKey}`);
  });
}
function createParamsManager(defaultPersistent) {
  const memoryMap = /* @__PURE__ */ new Map();
  let currentDefaultPersistent = defaultPersistent;
  function setDefaultPersistent(persistent) {
    currentDefaultPersistent = persistent;
  }
  function set(params, persistent) {
    const useStorage = persistent ?? currentDefaultPersistent;
    const key = generateKey();
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

// src/utils/route.ts
function injectQueryKey(location, key, value) {
  if (typeof location === "string") {
    return { path: location, query: { [key]: value } };
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
var NAV_ID_KEY = "__nav_id";
var navIdSeq = 0;
function generateNavId() {
  return `nav-${Date.now()}-${++navIdSeq}`;
}
var NAV_EVENT_PREFIX = "uni-router";
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

// src/types/error.ts
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

// src/guard/index.ts
var DEFAULT_GUARD_TIMEOUT = 1e4;
function runGuard(guard, to, from, timeout) {
  return new Promise((resolve) => {
    let resolved = false;
    let timer;
    const next = (location, options) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      if (location === false) {
        resolve({ type: "abort", code: "NAVIGATION_ABORTED" /* NAVIGATION_ABORTED */ });
      } else if (location) {
        resolve({ type: "next", redirect: location, mode: options?.mode });
      } else {
        resolve({ type: "next" });
      }
    };
    if (timeout > 0) {
      timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          warn(`Navigation guard "${guard.name || "anonymous"}" did not resolve within ${timeout / 1e3}s. Make sure to call next() in your guard function.`);
          resolve({ type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ });
        }
      }, timeout);
    }
    let promiseResult;
    try {
      promiseResult = guard(to, from, next);
    } catch {
      if (!resolved) {
        resolved = true;
        if (timer) clearTimeout(timer);
        resolve({ type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ });
      }
      return;
    }
    if (promiseResult) {
      promiseResult.then(() => {
        if (!resolved) {
          resolved = true;
          if (timer) clearTimeout(timer);
          resolve({ type: "next" });
        } else {
          warn(`Navigation guard "${guard.name || "anonymous"}" called next() and also returned a Promise. Use either next() callback or async/await, not both.`);
        }
      }).catch(() => {
        if (!resolved) {
          resolved = true;
          if (timer) clearTimeout(timer);
          resolve({ type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ });
        }
      });
    }
  });
}
async function runGuardQueue(guards, to, from, timeout) {
  for (const guard of guards) {
    const result = await runGuard(guard, to, from, timeout);
    if (result.type === "abort") return result;
    if (result.redirect) return result;
  }
  return { type: "next" };
}
function createGuardManager(guardTimeout = DEFAULT_GUARD_TIMEOUT) {
  const beforeGuards = [];
  const beforeResolveGuards = [];
  const afterGuards = [];
  function beforeEach(guard) {
    beforeGuards.push(guard);
    return () => {
      const index = beforeGuards.indexOf(guard);
      if (index > -1) beforeGuards.splice(index, 1);
    };
  }
  function beforeResolve(guard) {
    beforeResolveGuards.push(guard);
    return () => {
      const index = beforeResolveGuards.indexOf(guard);
      if (index > -1) beforeResolveGuards.splice(index, 1);
    };
  }
  function afterEach(guard) {
    afterGuards.push(guard);
    return () => {
      const index = afterGuards.indexOf(guard);
      if (index > -1) afterGuards.splice(index, 1);
    };
  }
  function runBeforeGuards(to, from) {
    return runGuardQueue(beforeGuards, to, from, guardTimeout);
  }
  function runBeforeResolveGuards(to, from) {
    return runGuardQueue(beforeResolveGuards, to, from, guardTimeout);
  }
  async function runBeforeEnterGuards(to, from, route) {
    if (!route.beforeEnter) return { type: "next" };
    const guards = Array.isArray(route.beforeEnter) ? route.beforeEnter : [route.beforeEnter];
    return runGuardQueue(guards, to, from, guardTimeout);
  }
  function runAfterGuards(to, from) {
    for (const guard of afterGuards) {
      try {
        guard(to, from);
      } catch {
      }
    }
  }
  return {
    beforeEach,
    beforeResolve,
    afterEach,
    runBeforeGuards,
    runBeforeResolveGuards,
    runBeforeEnterGuards,
    runAfterGuards
  };
}

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

// src/plugins/interceptor/install.ts
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
var INTERCEPTED_APIS = ["navigateTo", "redirectTo", "switchTab", "reLaunch", "navigateBack"];
function isWebPlatform() {
  return typeof window !== "undefined" && typeof document !== "undefined";
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

// src/navigation/navigate.ts
function promisifyUniApi(api, executor) {
  return new Promise((resolve, reject) => {
    executor(resolve, (err) => reject(new UniApiError(api, err)));
  });
}
function uniNavigateTo(path, query, animation, events) {
  const url = buildFullPath(path, query ?? {});
  return new Promise((resolve, reject) => {
    markRouterCall();
    uni.navigateTo({
      url,
      events,
      ...animation?.type && { animationType: animation.type },
      ...animation?.duration != null && { animationDuration: animation.duration },
      success: (res) => resolve(res.eventChannel),
      fail: (err) => reject(new UniApiError("navigateTo", err))
    });
  });
}
function uniSwitchTab(path) {
  return promisifyUniApi("switchTab", (resolve, reject) => {
    markRouterCall();
    uni.switchTab({ url: path, success: resolve, fail: reject });
  });
}
function uniRedirectTo(path, query) {
  const url = buildFullPath(path, query ?? {});
  return promisifyUniApi("redirectTo", (resolve, reject) => {
    markRouterCall();
    uni.redirectTo({ url, success: resolve, fail: reject });
  });
}
function uniNavigateBack(delta = 1, animation) {
  return promisifyUniApi("navigateBack", (resolve, reject) => {
    markRouterCall();
    uni.navigateBack({
      delta,
      ...animation?.type && { animationType: animation.type },
      ...animation?.duration != null && { animationDuration: animation.duration },
      success: resolve,
      fail: reject
    });
  });
}
function uniReLaunch(path, query) {
  const url = buildFullPath(path, query ?? {});
  return promisifyUniApi("reLaunch", (resolve, reject) => {
    markRouterCall();
    uni.reLaunch({ url, success: resolve, fail: reject });
  });
}
function hasQueryParams(query) {
  return !!query && Object.keys(query).length > 0;
}
function navigateTo(options) {
  const { path, meta, query, animation, events } = options;
  const effectiveAnimation = animation ?? meta.animation;
  if (meta.isTab) {
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (effectiveAnimation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    if (events) {
      warn("uni.switchTab does not support events. The events option will be ignored.");
    }
    return uniSwitchTab(path).then(() => void 0);
  }
  return uniNavigateTo(path, query, effectiveAnimation, events);
}
function replaceTo(options) {
  const { path, meta, query, animation } = options;
  const effectiveAnimation = animation ?? meta.animation;
  if (meta.isTab) {
    warn("router.replace() to a tab page will close all non-tab pages instead of replacing the current page only");
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (effectiveAnimation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    return uniSwitchTab(path);
  }
  if (effectiveAnimation) {
    warn("uni.redirectTo does not support animation parameters. The animation option will be ignored.");
  }
  return uniRedirectTo(path, query);
}
function goBack(delta = 1, animation) {
  return uniNavigateBack(delta, animation);
}
function relaunchTo(options) {
  const { path, meta, query, animation } = options;
  const effectiveAnimation = animation ?? meta.animation;
  if (meta.isTab) {
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (effectiveAnimation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    return uniSwitchTab(path);
  }
  if (effectiveAnimation) {
    warn("uni.reLaunch does not support animation parameters. The animation option will be ignored.");
  }
  return uniReLaunch(path, query);
}

// src/navigation/context.ts
function getPageStackLength() {
  return safeGetCurrentPages().length;
}
function getCurrentPagePath() {
  const pages = safeGetCurrentPages();
  if (pages.length === 0) return "/";
  const currentPage = pages[pages.length - 1];
  return `/${currentPage.route}`;
}
function getCurrentPageQuery() {
  const pages = safeGetCurrentPages();
  if (pages.length === 0) return {};
  const currentPage = pages[pages.length - 1];
  if (!currentPage?.options) return {};
  const query = {};
  for (const [key, value] of Object.entries(currentPage.options)) {
    if (value !== void 0) {
      query[key] = String(value);
    }
  }
  return query;
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

// src/state/index.ts
var START_LOCATION = createStartLocation();
var DEFAULT_READY_TIMEOUT = 0;
function createRouteState(readyTimeout = DEFAULT_READY_TIMEOUT) {
  let currentRoute = START_LOCATION;
  let ready = false;
  const readyResolvers = [];
  const readyRejecters = [];
  const listeners = [];
  let readyTimer = null;
  function getCurrentRoute() {
    return currentRoute;
  }
  function setCurrentRoute(route) {
    const from = currentRoute;
    currentRoute = createRouteLocation({
      path: route.path,
      name: route.name,
      meta: { ...route.meta },
      query: { ...route.query },
      fullPath: route.fullPath,
      params: route.params,
      ...route._synced !== void 0 && { _synced: route._synced }
    });
    for (const listener of listeners) {
      listener(currentRoute, from);
    }
  }
  function markReady() {
    if (ready) return;
    ready = true;
    if (readyTimer) {
      clearTimeout(readyTimer);
      readyTimer = null;
    }
    for (const resolve of readyResolvers) {
      resolve();
    }
    readyResolvers.length = 0;
    readyRejecters.length = 0;
  }
  function initCurrentRoute(path, meta, query) {
    const fullPath = buildFullPath(path, query);
    setCurrentRoute(createRouteLocation({ path, meta, query, fullPath }));
  }
  function isReady() {
    return ready;
  }
  function onReady() {
    if (ready) return Promise.resolve();
    return new Promise((resolve, reject) => {
      readyResolvers.push(resolve);
      readyRejecters.push(reject);
      if (readyTimeout > 0 && !readyTimer) {
        readyTimer = setTimeout(() => {
          if (ready) return;
          const error = new Error(`[uni-router] Router isReady() timed out after ${readyTimeout}ms. The router was not initialized properly.`);
          for (const rejecter of readyRejecters) {
            rejecter(error);
          }
          readyResolvers.length = 0;
          readyRejecters.length = 0;
          readyTimer = null;
        }, readyTimeout);
      }
    });
  }
  function onRouteChange(listener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }
  return {
    getCurrentRoute,
    setCurrentRoute,
    markReady,
    initCurrentRoute,
    isReady,
    onReady,
    onRouteChange
  };
}

// src/matcher/index.ts
function createRouteMatcher(routes, strict, paramsManager) {
  const pathMap = /* @__PURE__ */ new Map();
  const nameMap = /* @__PURE__ */ new Map();
  const routeList = [];
  for (const route of routes) {
    if (route.name && nameMap.has(route.name)) {
      warn(`Duplicate route name "${route.name}" detected. The later one will overwrite the previous.`);
    }
    const normalizedPath = normalizePath(route.path);
    if (pathMap.has(normalizedPath)) {
      warn(`Duplicate route path "${normalizedPath}" detected. The later one will overwrite the previous.`);
    }
    pathMap.set(normalizedPath, route);
    if (route.name) {
      nameMap.set(route.name, route);
    }
    routeList.push(route);
  }
  function getRoutes() {
    return [...routeList];
  }
  function hasRoute(name) {
    return nameMap.has(name);
  }
  function getRouteConfig(path) {
    return pathMap.get(normalizePath(path));
  }
  function resolve(location) {
    if (typeof location === "string") {
      return resolveFromPath(location);
    }
    if (isObject(location)) {
      if ("name" in location) {
        return resolveFromName(location);
      }
      if ("path" in location) {
        return resolveFromPathRaw(location);
      }
    }
    throw new RouterError("ROUTE_NOT_FOUND" /* ROUTE_NOT_FOUND */, `Invalid route location: ${JSON.stringify(location)}`);
  }
  function resolveFromPath(path) {
    const queryIndex = path.indexOf("?");
    const rawPath = queryIndex === -1 ? path : path.slice(0, queryIndex);
    const queryString = queryIndex === -1 ? "" : path.slice(queryIndex + 1);
    const normalizedPath = normalizePath(rawPath);
    const config = pathMap.get(normalizedPath);
    const query = queryString ? parseQuery(queryString) : {};
    const meta = config?.meta ?? {};
    const params = extractParams(query);
    return createRouteLocation({
      path: normalizedPath,
      name: config?.name,
      meta,
      query,
      fullPath: buildFullPath(normalizedPath, query),
      params
    });
  }
  function resolveFromPathRaw(location) {
    const normalizedPath = normalizePath(location.path);
    const config = pathMap.get(normalizedPath);
    const query = serializeQuery(location.query);
    const meta = config?.meta ?? {};
    const params = extractParams(query);
    return createRouteLocation({
      path: normalizedPath,
      name: config?.name,
      meta,
      query,
      fullPath: buildFullPath(normalizedPath, query),
      params
    });
  }
  function resolveFromName(location) {
    const config = nameMap.get(location.name);
    if (!config) {
      if (strict) {
        throw new RouterError("ROUTE_NOT_FOUND" /* ROUTE_NOT_FOUND */, `Route name "${location.name}" not found`);
      }
      warn(`Route name "${location.name}" not found`);
      const query2 = serializeQuery(location.query);
      const path = `/${location.name}`;
      const params2 = extractParams(query2);
      return createRouteLocation({
        path,
        meta: {},
        query: query2,
        fullPath: buildFullPath(path, query2),
        params: params2
      });
    }
    const query = serializeQuery(location.query);
    const resolvedPath = normalizePath(config.path);
    const params = extractParams(query);
    return createRouteLocation({
      path: resolvedPath,
      name: config.name,
      meta: config.meta ?? {},
      query,
      fullPath: buildFullPath(resolvedPath, query),
      params
    });
  }
  function extractParams(query) {
    const params = {};
    const key = query[PARAMS_KEY];
    if (key) {
      delete query[PARAMS_KEY];
      const stored = paramsManager.peek(decodeURIComponent(key));
      if (stored) Object.assign(params, stored);
    }
    return Object.keys(params).length > 0 ? params : void 0;
  }
  return {
    getRoutes,
    hasRoute,
    resolve,
    getRouteConfig
  };
}

// src/router/location.ts
function isSameRouteLocation(a, b) {
  if (a.path !== b.path) return false;
  if (a.name !== b.name) return false;
  return isSameQuery(a.query, b.query);
}

// src/router/sync.ts
function createRouteSync(routeState, matcher, onSyncCleanup, runSyncHooks) {
  function syncRoute() {
    const from = routeState.getCurrentRoute();
    const currentPath = getCurrentPagePath();
    const currentQuery = getCurrentPageQuery();
    const ignoredParams = {};
    runSyncHooks(currentQuery, ignoredParams);
    if (currentPath === from.path && isSameQuery(currentQuery, from.query)) return;
    syncCurrentRoute();
    onSyncCleanup();
  }
  function syncCurrentRoute() {
    const currentPath = getCurrentPagePath();
    const config = matcher.getRouteConfig(currentPath);
    const meta = config?.meta ?? {};
    const query = getCurrentPageQuery();
    const params = {};
    runSyncHooks(query, params);
    const fullPath = buildFullPath(currentPath, query);
    const to = createRouteLocation({ path: currentPath, name: config?.name, meta, query, fullPath, params: Object.keys(params).length > 0 ? params : void 0, _synced: true });
    routeState.setCurrentRoute(to);
  }
  return { syncRoute, syncCurrentRoute };
}

// src/router/index.ts
var MAX_REDIRECT_DEPTH = 10;
var UniRouter = class {
  /**
   * @param options - 路由器初始化选项
   */
  constructor(options) {
    __publicField(this, "routeState", createRouteState());
    __publicField(this, "guardManager", createGuardManager());
    __publicField(this, "paramsManager", createParamsManager(false));
    __publicField(this, "matcher", createRouteMatcher([], true, this.paramsManager));
    __publicField(this, "routeSync");
    __publicField(this, "errorHandlers", []);
    __publicField(this, "pendingNavigation", null);
    __publicField(this, "installedPlugins", /* @__PURE__ */ new Set());
    // 插件 hook 数组
    __publicField(this, "enrichLocationHooks", []);
    __publicField(this, "afterResolveHooks", []);
    __publicField(this, "prepareNavigationHooks", []);
    __publicField(this, "completeNavigationHooks", []);
    __publicField(this, "navigationAbortHooks", []);
    __publicField(this, "routeSyncHooks", []);
    __publicField(this, "appInstallHooks", []);
    this.guardManager = createGuardManager(options.guardTimeout);
    this.paramsManager = createParamsManager(false);
    this.matcher = createRouteMatcher(options.routes, options.strict ?? true, this.paramsManager);
    this.routeState = createRouteState(options.readyTimeout);
    this.installPlugins(options.plugins ?? [], options);
    this.routeSync = createRouteSync(
      this.routeState,
      this.matcher,
      () => this.paramsManager.cleanupStale(),
      (query, params) => {
        for (const hook of this.routeSyncHooks) {
          hook(query, params);
        }
      }
    );
    this.paramsManager.cleanupAll();
    this.initRoute();
  }
  /**
   * 安装插件并注册 hook
   */
  installPlugins(plugins, options) {
    const self = this;
    const context = {
      onEnrichLocation: (hook) => {
        this.enrichLocationHooks.push(hook);
      },
      onAfterResolve: (hook) => {
        this.afterResolveHooks.push(hook);
      },
      onPrepareNavigation: (hook) => {
        this.prepareNavigationHooks.push(hook);
      },
      onCompleteNavigation: (hook) => {
        this.completeNavigationHooks.push(hook);
      },
      onNavigationAbort: (hook) => {
        this.navigationAbortHooks.push(hook);
      },
      onRouteSync: (hook) => {
        this.routeSyncHooks.push(hook);
      },
      onAppInstall: (hook) => {
        this.appInstallHooks.push(hook);
      },
      get currentRoute() {
        return self.routeState.getCurrentRoute();
      },
      resolve: (location) => self.matcher.resolve(location),
      get router() {
        return self;
      },
      get paramsManager() {
        return self.paramsManager;
      },
      hasPlugin(name) {
        return self.installedPlugins.has(name);
      }
    };
    for (const plugin of plugins) {
      this.installedPlugins.add(plugin.name);
      plugin.install(context, options);
    }
    if (options.paramsPersistent && !this.installedPlugins.has("params")) {
      warn("options.paramsPersistent is set but ParamsPlugin is not registered. The option will be ignored.");
    }
    if (options.useUniEventChannel && !this.installedPlugins.has("channel")) {
      warn("options.useUniEventChannel is set but ChannelPlugin is not registered. The option will be ignored.");
    }
    if (options.interceptUniApi && !this.installedPlugins.has("interceptor")) {
      warn("options.interceptUniApi is set but InterceptorPlugin is not registered. The option will be ignored.");
    }
  }
  /**
   * 获取当前路由位置
   */
  get currentRoute() {
    return this.routeState.getCurrentRoute();
  }
  /**
   * 导航到新页面
   *
   * 对应 uni.navigateTo（普通页面）或 uni.switchTab（TabBar 页面）。
   * 若目标与当前位置相同，将拒绝导航并抛出 NAVIGATION_DUPLICATED 错误。
   * 并发导航将排队执行，前一次导航完成后再开始下一次。
   *
   * 返回 NavigationResult，包含目标路由位置和可选的 eventChannel。
   * eventChannel 仅在对应 uni.navigateTo 时可用，用于页面间双向通信。
   *
   * @param location - 目标路由位置
   * @returns 导航结果，包含目标路由位置和可选的 eventChannel
   * @throws {NavigationFailure} 导航被守卫中止、重复或 API 调用失败时抛出
   */
  push(location) {
    return this.performNavigation(location, "push");
  }
  /**
   * 替换当前页面
   *
   * 对应 uni.redirectTo（普通页面）或 uni.switchTab（TabBar 页面）。
   * 替换 TabBar 页面时将关闭所有非 Tab 页面。
   *
   * @param location - 目标路由位置
   * @returns 导航结果，包含目标路由位置和可选的 eventChannel
   * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
   */
  replace(location) {
    return this.performNavigation(location, "replace");
  }
  /**
   * 关闭所有页面并打开目标页面
   *
   * 对应 uni.reLaunch（普通页面）或 uni.switchTab（TabBar 页面）。
   * 常用于退出登录后跳转登录页、从深层页面返回首页、重置整个页面栈等场景。
   * reLaunch 不支持动画参数，传入时将输出警告。
   *
   * @param location - 目标路由位置
   * @returns 导航结果，包含目标路由位置和可选的 eventChannel
   * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
   */
  relaunch(location) {
    return this.performNavigation(location, "relaunch");
  }
  /**
   * 返回上一页或多级页面
   *
   * 对应 uni.navigateBack。执行完整的导航守卫链（beforeEach → beforeResolve），
   * 守卫可中止或重定向返回操作。
   *
   * 注意：物理返回键和浏览器后退不经过路由器，无法被守卫拦截。
   * 对于原生返回，需依赖 syncRoute() + afterEach 做事后处理。
   *
   * @param delta - 返回的页面数，默认为 1
   * @param options - 额外选项（AnimationPlugin 通过模块增强添加 animation 字段）
   * @throws {NavigationFailure} 导航被守卫中止或 API 调用失败时抛出
   */
  async back(delta = 1, options) {
    if (this.pendingNavigation) {
      await this.pendingNavigation.catch(() => {
      });
    }
    if (options && "animation" in options && !this.installedPlugins.has("animation")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "AnimationPlugin is required to use animation in back(). Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).");
    }
    const from = this.routeState.getCurrentRoute();
    const pages = getCurrentPages();
    const targetIndex = pages.length - 1 - delta;
    if (targetIndex < 0) {
      const failure = new NavigationFailure(from, from, "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */, "Cannot go back: no previous page in the navigation stack");
      this.triggerErrorHandlers(failure, from, from);
      return Promise.reject(failure);
    }
    const targetPage = pages[targetIndex];
    const targetPath = `/${targetPage.route}`;
    const to = this.matcher.resolve(targetPath);
    const pluginData = {};
    const beforeResult = await this.guardManager.runBeforeGuards(to, from);
    const handled = this.handleGuardResult(beforeResult, to, from, "back", 0, pluginData);
    if (handled) return handled;
    const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from);
    const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, "back", 0, pluginData);
    if (handledResolve) return handledResolve;
    const navOptions = {
      path: to.path,
      meta: to.meta,
      query: { ...to.query },
      animation: to.meta.animation
    };
    if (options && "animation" in options) {
      pluginData["animation"] = { animation: options.animation };
    }
    const prepareCtx = {
      to,
      from,
      mode: "back",
      pluginData,
      query: navOptions.query,
      options: navOptions
    };
    for (const hook of this.prepareNavigationHooks) {
      hook(prepareCtx);
    }
    const animation = navOptions.animation;
    try {
      await goBack(delta, animation);
      this.routeSync.syncCurrentRoute();
      this.guardManager.runAfterGuards(to, from);
      return this.routeState.getCurrentRoute();
    } catch (error) {
      this.runAbortHooks(pluginData);
      const code = "NAVIGATION_API_ERROR" /* NAVIGATION_API_ERROR */;
      const cause = isUniApiError(error) ? error : void 0;
      const failure = new NavigationFailure(to, from, code, void 0, cause);
      this.triggerErrorHandlers(failure, to, from);
      return Promise.reject(failure);
    }
  }
  /**
   * 注册全局前置守卫，在每次导航前执行
   * @param guard - 前置守卫函数
   * @returns 用于移除此守卫的函数
   */
  beforeEach(guard) {
    return this.guardManager.beforeEach(guard);
  }
  /**
   * 注册全局解析守卫，在所有前置守卫和路由独享守卫完成后执行
   * @param guard - 解析守卫函数
   * @returns 用于移除此守卫的函数
   */
  beforeResolve(guard) {
    return this.guardManager.beforeResolve(guard);
  }
  /**
   * 注册全局后置钩子，在导航完成后执行
   * @param guard - 后置钩子函数
   * @returns 用于移除此钩子的函数
   */
  afterEach(guard) {
    return this.guardManager.afterEach(guard);
  }
  /**
   * 获取所有已注册的路由配置列表
   * @returns 路由配置数组的浅拷贝
   */
  getRoutes() {
    return this.matcher.getRoutes();
  }
  /**
   * 检查是否存在指定名称的路由
   * @param name - 路由名称
   * @returns 存在时返回 true
   */
  hasRoute(name) {
    return this.matcher.hasRoute(name);
  }
  /**
   * 检查指定插件是否已注册
   *
   * 插件未注册时使用其功能将抛出 PLUGIN_REQUIRED 错误。
   *
   * @param name - 插件名称
   * @returns 已注册时返回 true
   */
  hasPlugin(name) {
    return this.installedPlugins.has(name);
  }
  /**
   * 解析路由位置为完整的 RouteLocation 对象，不执行导航
   * @param location - 原始路由位置
   * @returns 解析后的路由位置
   * @throws {RouterError} 严格模式下未找到路由时抛出
   */
  resolve(location) {
    return this.matcher.resolve(location);
  }
  /**
   * 等待路由器初始化完成
   * @returns 路由器就绪后 resolve 的 Promise
   */
  isReady() {
    return this.routeState.onReady();
  }
  /**
   * 注册路由错误处理回调
   *
   * 当导航过程中发生错误时，所有已注册的错误处理器将被依次调用。
   * 处理器中的异常不会影响其他处理器的执行。
   *
   * @param handler - 错误处理函数
   * @returns 用于移除此处理器的函数
   */
  onError(handler) {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) this.errorHandlers.splice(index, 1);
    };
  }
  /**
   * 注册路由变化监听器
   *
   * 当路由状态发生变化时（包括导航完成和状态同步），监听器将被调用。
   * 与 afterEach 不同，此方法用于订阅路由状态变化，不参与导航流程控制。
   *
   * @param listener - 路由变化回调函数
   * @returns 用于移除此监听器的函数
   */
  onRouteChange(listener) {
    return this.routeState.onRouteChange(listener);
  }
  /**
   * 同步路由状态与实际页面栈
   *
   * 路由器 install 时通过全局 mixin 在每个页面 onShow 自动调用此方法。
   * 若需在 onLoad 中获取路由信息，可手动调用（onLoad 早于 onShow）。
   */
  syncRoute() {
    this.routeSync.syncRoute();
  }
  /**
   * 对指定路由执行守卫链检查（不执行实际导航）
   *
   * 用于冷启动场景：用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入页面时，
   * 页面由 uni-app 框架直接加载，不经过路由器导航，守卫（beforeEach 等）未执行。
   * 调用此方法可对当前页面补执行守卫链，按守卫结果决定是否重定向。
   *
   * @param location - 目标路由位置，不传时默认检查当前路由
   * @param options - 选项，可传入 onAbort 回调处理守卫中止
   * @returns 守卫放行时 resolve 目标路由；重定向时跳转后 resolve；中止时 reject
   */
  async guardRoute(location, options) {
    const target = location ? this.matcher.resolve(location) : this.routeState.getCurrentRoute();
    const from = this.routeState.getCurrentRoute();
    const beforeResult = await this.guardManager.runBeforeGuards(target, from);
    const handled = this.handleGuardRouteResult(beforeResult, target, from, options);
    if (handled) return handled;
    const config = this.matcher.getRouteConfig(target.path);
    if (config?.beforeEnter) {
      const beforeEnterResult = await this.guardManager.runBeforeEnterGuards(target, from, config);
      const handledEnter = this.handleGuardRouteResult(beforeEnterResult, target, from, options);
      if (handledEnter) return handledEnter;
    }
    const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(target, from);
    const handledResolve = this.handleGuardRouteResult(beforeResolveResult, target, from, options);
    if (handledResolve) return handledResolve;
    return target;
  }
  /**
   * 处理 guardRoute 的守卫执行结果
   */
  handleGuardRouteResult(result, to, from, options) {
    if (result.type === "abort") {
      const failure = new NavigationFailure(to, from, result.code);
      this.triggerErrorHandlers(failure, to, from);
      options?.onAbort?.(failure);
      return Promise.reject(failure);
    }
    if (result.redirect) {
      const mode = result.mode ?? "relaunch";
      if (mode === "replace") {
        return this.replace(result.redirect);
      } else if (mode === "push") {
        return this.push(result.redirect);
      }
      return this.relaunch(result.redirect);
    }
    return null;
  }
  /**
   * 安装路由器到 Vue 应用实例
   *
   * 注册全局属性 `$router` 和 `$route`，并通过 provide/inject 机制
   * 使组件可以通过 `useRouter()` / `useRoute()` 访问路由器。
   * 同时注入全局 mixin，在每个页面 onShow 时自动调用 syncRoute() 同步路由状态。
   *
   * @param app - Vue 应用实例
   */
  install(app) {
    app.provide(ROUTER_SYMBOL, this);
    if (!("$router" in app.config.globalProperties)) {
      app.config.globalProperties.$router = this;
    }
    if (!("$route" in app.config.globalProperties)) {
      Object.defineProperty(app.config.globalProperties, "$route", {
        enumerable: true,
        configurable: true,
        get: () => this.currentRoute
      });
    }
    for (const hook of this.appInstallHooks) {
      hook(app);
    }
    const router = this;
    app.mixin({
      onShow() {
        router.syncRoute();
      }
    });
    this.routeState.markReady();
  }
  /**
   * 根据当前页面栈初始化路由状态
   */
  initRoute() {
    if (getPageStackLength() === 0) {
      this.routeState.initCurrentRoute("/", {}, {});
      return;
    }
    const currentPath = getCurrentPagePath();
    const config = this.matcher.getRouteConfig(currentPath);
    const meta = config?.meta ?? {};
    const query = getCurrentPageQuery();
    this.routeState.initCurrentRoute(currentPath, meta, query);
  }
  /**
   * 执行导航流程
   *
   * 处理并发导航排队、重复导航检测，并委托 executeNavigation 执行完整的守卫链和导航操作。
   *
   * @param location - 目标路由位置
   * @param mode - 导航模式，push、replace 或 relaunch
   * @returns 导航结果（push 模式包含 eventChannel）
   * @throws {NavigationFailure} 导航失败时抛出
   */
  async performNavigation(location, mode) {
    if (this.pendingNavigation) {
      await this.pendingNavigation.catch(() => {
      });
    }
    this.requirePluginForLocation(location);
    let enrichedLocation = location;
    for (const hook of this.enrichLocationHooks) {
      enrichedLocation = hook(enrichedLocation);
    }
    const to = this.matcher.resolve(enrichedLocation);
    const from = this.routeState.getCurrentRoute();
    const pluginData = {};
    for (const hook of this.afterResolveHooks) {
      hook(enrichedLocation, pluginData);
    }
    if (mode === "push" && isSameRouteLocation(to, from)) {
      this.runAbortHooks(pluginData);
      const failure = new NavigationFailure(to, from, "NAVIGATION_DUPLICATED" /* NAVIGATION_DUPLICATED */, `Avoided redundant navigation to current location: "${to.fullPath}"`);
      this.triggerErrorHandlers(failure, to, from);
      return Promise.reject(failure);
    }
    const navigationPromise = this.executeNavigation(to, from, mode, 0, pluginData);
    this.pendingNavigation = navigationPromise;
    try {
      const result = await navigationPromise;
      return result;
    } finally {
      if (this.pendingNavigation === navigationPromise) {
        this.pendingNavigation = null;
      }
    }
  }
  /**
   * 执行完整的导航流程，包括守卫链和 uni API 调用
   *
   * 依次执行：全局前置守卫 → 路由独享守卫 → 全局解析守卫 → uni 导航 API → 全局后置钩子。
   * 支持守卫重定向，但重定向深度超过 MAX_REDIRECT_DEPTH 时将取消导航。
   *
   * @param to - 目标路由
   * @param from - 来源路由
   * @param mode - 导航模式
   * @param redirectDepth - 当前重定向深度
   * @param pluginData - 插件间共享数据
   * @returns 导航结果
   * @throws {NavigationFailure} 导航被中止、取消或 API 调用失败时抛出
   */
  async executeNavigation(to, from, mode, redirectDepth, pluginData) {
    if (redirectDepth > MAX_REDIRECT_DEPTH) {
      this.runAbortHooks(pluginData);
      const failure = new NavigationFailure(to, from, "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`);
      this.triggerErrorHandlers(failure, to, from);
      return Promise.reject(failure);
    }
    const config = this.matcher.getRouteConfig(to.path);
    const beforeResult = await this.guardManager.runBeforeGuards(to, from);
    const handled = this.handleGuardResult(beforeResult, to, from, mode, redirectDepth, pluginData);
    if (handled) return handled;
    const beforeEnterResult = config ? await this.guardManager.runBeforeEnterGuards(to, from, config) : { type: "next" };
    const handledEnter = this.handleGuardResult(beforeEnterResult, to, from, mode, redirectDepth, pluginData);
    if (handledEnter) return handledEnter;
    const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from);
    const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, mode, redirectDepth, pluginData);
    if (handledResolve) return handledResolve;
    const toWithSyncedParams = this.applySyncHooks(to);
    this.routeState.setCurrentRoute(toWithSyncedParams);
    try {
      const queryWithKeys = { ...to.query };
      const navOptions = {
        path: to.path,
        meta: to.meta,
        query: queryWithKeys,
        animation: to.meta.animation
      };
      const prepareCtx = {
        to,
        from,
        mode,
        pluginData,
        query: queryWithKeys,
        options: navOptions
      };
      for (const hook of this.prepareNavigationHooks) {
        hook(prepareCtx);
      }
      let nativeEventChannel;
      if (mode === "push") {
        nativeEventChannel = await navigateTo(navOptions);
      } else if (mode === "replace") {
        await replaceTo(navOptions);
      } else {
        await relaunchTo(navOptions);
      }
      this.guardManager.runAfterGuards(to, from);
      const result = { ...to };
      if (mode === "push") {
        result.eventChannel = nativeEventChannel;
      }
      const completeCtx = {
        to,
        mode,
        pluginData,
        nativeEventChannel,
        result
      };
      for (const hook of this.completeNavigationHooks) {
        hook(completeCtx);
      }
      return result;
    } catch (error) {
      this.routeState.setCurrentRoute(from);
      this.runAbortHooks(pluginData);
      const code = "NAVIGATION_API_ERROR" /* NAVIGATION_API_ERROR */;
      const cause = isUniApiError(error) ? error : void 0;
      const failure = new NavigationFailure(to, from, code, void 0, cause);
      this.triggerErrorHandlers(failure, to, from);
      return Promise.reject(failure);
    }
  }
  /**
   * 处理守卫执行结果
   *
   * 根据守卫返回的结果决定后续行为：
   * - abort: 中止导航并抛出 NavigationFailure
   * - next + redirect: 递归执行重定向导航
   * - next: 继续执行后续守卫
   */
  handleGuardResult(result, to, from, mode, redirectDepth, pluginData) {
    if (result.type === "abort") {
      this.runAbortHooks(pluginData);
      const failure = new NavigationFailure(to, from, result.code);
      this.triggerErrorHandlers(failure, to, from);
      return Promise.reject(failure);
    }
    if (result.redirect) {
      let enrichedRedirect = result.redirect;
      for (const hook of this.enrichLocationHooks) {
        enrichedRedirect = hook(enrichedRedirect);
      }
      const redirectTarget = this.matcher.resolve(enrichedRedirect);
      const redirectPluginData = { ...pluginData };
      for (const hook of this.afterResolveHooks) {
        hook(enrichedRedirect, redirectPluginData);
      }
      const redirectMode = result.mode ?? (mode === "back" ? "relaunch" : mode);
      return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, redirectPluginData);
    }
    return null;
  }
  /**
   * 执行所有 abort hooks
   */
  runAbortHooks(pluginData) {
    for (const hook of this.navigationAbortHooks) {
      try {
        hook(pluginData);
      } catch {
      }
    }
  }
  /**
   * 对路由位置执行 routeSync hooks，将内部 key（如 __nav_id）从 query 提取到 params
   *
   * 用于导航时 setCurrentRoute 前预处理，确保目标页 onLoad 时 params 已包含插件数据。
   * 同时从 query 中移除内部 key，避免暴露给用户。
   */
  applySyncHooks(to) {
    const query = { ...to.query };
    const params = { ...to.params };
    for (const hook of this.routeSyncHooks) {
      hook(query, params);
    }
    const fullPath = buildFullPath(to.path, query);
    return createRouteLocation({ ...to, query, fullPath, params: Object.keys(params).length > 0 ? params : void 0 });
  }
  /**
   * 检查路由位置是否使用了插件功能但未安装对应插件
   *
   * 当用户传入 params / events / animation 但对应插件未注册时，
   * 抛出 PLUGIN_REQUIRED 错误，帮助用户快速定位问题。
   */
  requirePluginForLocation(location) {
    if (typeof location === "string") return;
    const loc = location;
    if ("params" in loc && loc.params && !this.installedPlugins.has("params")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "ParamsPlugin is required to use params. Add ParamsPlugin to createRouter({ plugins: [ParamsPlugin] }).");
    }
    if ("events" in loc && loc.events && !this.installedPlugins.has("channel")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "ChannelPlugin is required to use events. Add ChannelPlugin to createRouter({ plugins: [ChannelPlugin] }).");
    }
    if ("animation" in loc && loc.animation && !this.installedPlugins.has("animation")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "AnimationPlugin is required to use animation. Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).");
    }
  }
  /**
   * 触发所有已注册的错误处理器
   */
  triggerErrorHandlers(error, to, from) {
    for (const handler of this.errorHandlers) {
      try {
        handler(error, to, from);
      } catch {
      }
    }
  }
};
var ROUTER_SYMBOL = /* @__PURE__ */ Symbol("uni-router");
function createRouter(options) {
  return new UniRouter(options);
}

// src/composables/index.ts
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
        const navId = generateNavId();
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

export { AnimationPlugin, ChannelPlugin, InterceptorPlugin, NavigationFailure, ParamsPlugin, ROUTER_SYMBOL, RouterError, RouterErrorCode, UniApiError, UniEventChannel, createRouter, noopChannel, usePageChannel, useRoute, useRouter };
