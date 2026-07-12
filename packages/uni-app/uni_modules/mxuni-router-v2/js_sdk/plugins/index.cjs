'use strict';

var vue = require('vue');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/utils/general.ts
function warn(message) {
  if (typeof console !== "undefined") {
    console.warn(`[uni-router] ${message}`);
  }
}

// src/plugins/params/params-manager.ts
var PARAMS_KEY = "__params_key";

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

// src/utils/path.ts
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

// src/utils/query.ts
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
createStartLocation();

// src/router/index.ts
var ROUTER_SYMBOL = /* @__PURE__ */ Symbol("uni-router");

// src/composables/index.ts
function useRouter() {
  let router;
  try {
    router = vue.inject(ROUTER_SYMBOL);
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
  routeRef = vue.ref(router.currentRoute);
  reactiveRouteMap.set(router, routeRef);
  router.onRouteChange((to) => {
    routeRef.value = to;
  });
  return routeRef;
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
  vue.onUnmounted(() => {
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

exports.AnimationPlugin = AnimationPlugin;
exports.ChannelPlugin = ChannelPlugin;
exports.InterceptorPlugin = InterceptorPlugin;
exports.ParamsPlugin = ParamsPlugin;
exports.usePageChannel = usePageChannel;
