'use strict';

var vue = require('vue');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

// src/guard/helpers/resolve.ts
function isRedirect(value) {
  return typeof value === "object" && value !== null && "location" in value;
}
function resolveGuardReturn(value) {
  if (value === false) {
    return { type: "abort", code: "NAVIGATION_ABORTED" /* NAVIGATION_ABORTED */ };
  }
  if (value instanceof Error) {
    return { type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ };
  }
  if (value === true || value === void 0 || value === null || value === void 0) {
    return { type: "next" };
  }
  if (isRedirect(value)) {
    return { type: "next", redirect: value.location, mode: value.mode };
  }
  return { type: "next", redirect: value };
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

// src/guard/helpers/run.ts
async function runGuard(guard, to, from, timeout) {
  let resolved = false;
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    if (timeout > 0) {
      timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          warn(`Navigation guard "${guard.name || "anonymous"}" timed out after ${timeout / 1e3}s. Make sure your guard resolves (returns a value or throws).`);
          resolve({ type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ });
        }
      }, timeout);
    }
  });
  try {
    const returnValue = guard(to, from);
    const result = await Promise.race([
      Promise.resolve(returnValue).then((value) => {
        resolved = true;
        if (timer) clearTimeout(timer);
        return resolveGuardReturn(value);
      }),
      timeoutPromise
    ]);
    return result;
  } catch {
    if (!resolved) {
      resolved = true;
      if (timer) clearTimeout(timer);
      return { type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ };
    }
    return { type: "abort", code: "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */ };
  }
}
async function runGuardQueue(guards, to, from, timeout) {
  for (const guard of guards) {
    const result = await runGuard(guard, to, from, timeout);
    if (result.type === "abort") return result;
    if (result.redirect) return result;
  }
  return { type: "next" };
}

// src/guard/index.ts
function createGuardManager(guardTimeout = DEFAULT_GUARD_TIMEOUT) {
  const beforeGuards = [];
  const beforeResolveGuards = [];
  const afterGuards = [];
  const beforeBackGuards = [];
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
  function runAfterGuards(to, from, failure) {
    for (const guard of afterGuards) {
      try {
        guard(to, from, failure);
      } catch {
      }
    }
  }
  function onBeforeBack(guard) {
    beforeBackGuards.push(guard);
    return () => {
      const index = beforeBackGuards.indexOf(guard);
      if (index > -1) beforeBackGuards.splice(index, 1);
    };
  }
  async function runBeforeBackGuards(to, from) {
    for (const guard of beforeBackGuards) {
      const result = await Promise.resolve(guard(to, from));
      if (result === false) return false;
    }
    return true;
  }
  return {
    beforeEach,
    beforeResolve,
    afterEach,
    runBeforeGuards,
    runBeforeResolveGuards,
    runBeforeEnterGuards,
    runAfterGuards,
    onBeforeBack,
    runBeforeBackGuards
  };
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

// src/utils/id.ts
function generateRandomId(prefix) {
  const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  return `${prefix}${hex}`;
}
var seq = 0;
function generateUniqueId(prefix) {
  return `${prefix}${Date.now()}-${++seq}`;
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

// src/utils/route.ts
function injectQueryKey(location2, key, value) {
  if (typeof location2 === "string") {
    const queryIndex = location2.indexOf("?");
    if (queryIndex === -1) {
      return { path: location2, query: { [key]: value } };
    }
    const path = location2.slice(0, queryIndex);
    const existingQuery = parseQuery(location2.slice(queryIndex + 1));
    return { path, query: { ...existingQuery, [key]: value } };
  }
  if ("path" in location2) {
    const pathLoc = location2;
    return {
      ...pathLoc,
      query: { ...pathLoc.query, [key]: value }
    };
  }
  if ("name" in location2) {
    const namedLoc = location2;
    return {
      ...namedLoc,
      query: { ...namedLoc.query, [key]: value }
    };
  }
  return location2;
}
function extractQueryKey(location2, key) {
  if (typeof location2 === "string") return void 0;
  if (typeof location2 === "object" && "query" in location2) {
    const query = location2.query;
    return query?.[key];
  }
  return void 0;
}

// src/plugins/animation/helpers/index.ts
function getTopPageElement() {
  if (typeof document === "undefined") return null;
  const pages = document.querySelectorAll("uni-page");
  if (!pages.length) return null;
  return pages[pages.length - 1];
}

// src/plugins/animation/h5.ts
var ANIMATION_CSS = `
@keyframes mxuni-slide-in-right { from { transform: translate3d(100%, 0, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-right { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(100%, 0, 0); } }
@keyframes mxuni-slide-in-left { from { transform: translate3d(-100%, 0, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-left { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-100%, 0, 0); } }
@keyframes mxuni-slide-in-top { from { transform: translate3d(0, -100%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-top { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -100%, 0); } }
@keyframes mxuni-slide-in-bottom { from { transform: translate3d(0, 100%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes mxuni-slide-out-bottom { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 100%, 0); } }
@keyframes mxuni-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes mxuni-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes mxuni-zoom-in { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes mxuni-zoom-out { from { transform: scale(1); } to { transform: scale(1.2); } }
@keyframes mxuni-zoom-fade-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes mxuni-zoom-fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.2); } }
@keyframes mxuni-pop-in { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes mxuni-pop-out { from { transform: scale(1); } to { transform: scale(1.2); } }
`;
var stylesInjected = false;
function ensureH5AnimationStyles() {
  if (stylesInjected || !getPlatform().isH5 || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-mxuni-animation", "");
  style.textContent = ANIMATION_CSS;
  (document.head || document.documentElement).appendChild(style);
}
var ENTER_KEYFRAMES = {
  "slide-in-right": "mxuni-slide-in-right",
  "slide-in-left": "mxuni-slide-in-left",
  "slide-in-top": "mxuni-slide-in-top",
  "slide-in-bottom": "mxuni-slide-in-bottom",
  "fade-in": "mxuni-fade-in",
  "zoom-in": "mxuni-zoom-in",
  "zoom-fade-in": "mxuni-zoom-fade-in",
  "pop-in": "mxuni-pop-in"
};
var EXIT_KEYFRAMES = {
  "slide-out-right": "mxuni-slide-out-right",
  "slide-out-left": "mxuni-slide-out-left",
  "slide-out-top": "mxuni-slide-out-top",
  "slide-out-bottom": "mxuni-slide-out-bottom",
  "fade-out": "mxuni-fade-out",
  "zoom-out": "mxuni-zoom-out",
  "zoom-fade-out": "mxuni-zoom-fade-out",
  "pop-out": "mxuni-pop-out"
};
function animatePageEnter(animation) {
  if (!getPlatform().isH5) return;
  ensureH5AnimationStyles();
  const keyframe = ENTER_KEYFRAMES[animation.type];
  if (!keyframe) return;
  requestAnimationFrame(() => {
    const el = getTopPageElement();
    if (!el) return;
    const duration = animation.duration ?? DEFAULT_ANIMATION_DURATION;
    el.style.animation = `${keyframe} ${duration}ms ease both`;
    const clear = () => {
      el.style.animation = "";
    };
    el.addEventListener("animationend", clear, { once: true });
    setTimeout(clear, duration + 100);
  });
}
async function animatePageExit(animation) {
  if (!getPlatform().isH5) return;
  ensureH5AnimationStyles();
  const keyframe = EXIT_KEYFRAMES[animation.type];
  if (!keyframe) return;
  const el = getTopPageElement();
  if (!el) return;
  const duration = animation.duration ?? DEFAULT_ANIMATION_DURATION;
  el.style.animation = `${keyframe} ${duration}ms ease both`;
  await new Promise((resolve) => {
    const clear = () => {
      el.style.animation = "";
      resolve();
    };
    const timer = setTimeout(clear, duration + 50);
    el.addEventListener(
      "animationend",
      () => {
        clearTimeout(timer);
        clear();
      },
      { once: true }
    );
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

// src/navigation/helpers/uni-api.ts
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
      success: (res) => {
        if (getPlatform().isH5 && animation) animatePageEnter(animation);
        resolve(res.eventChannel);
      },
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

// src/navigation/navigate.ts
function navigateTo(options) {
  const { path, meta, query, animation, events } = options;
  if (meta.isTab) {
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (animation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    if (events) {
      warn("uni.switchTab does not support events. The events option will be ignored.");
    }
    return uniSwitchTab(path).then(() => void 0);
  }
  return uniNavigateTo(path, query, animation, events);
}
function replaceTo(options) {
  const { path, meta, query, animation } = options;
  if (meta.isTab) {
    warn("router.replace() to a tab page will close all non-tab pages instead of replacing the current page only");
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (animation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    return uniSwitchTab(path);
  }
  if (animation) {
    warn("uni.redirectTo does not support animation parameters. The animation option will be ignored.");
  }
  return uniRedirectTo(path, query);
}
async function goBack(delta = 1, animation) {
  if (getPlatform().isH5 && animation) {
    await animatePageExit(animation);
  }
  return uniNavigateBack(delta, animation);
}
function relaunchTo(options) {
  const { path, meta, query, animation } = options;
  if (meta.isTab) {
    if (hasQueryParams(query)) {
      warn("uni.switchTab does not support query parameters. They will be ignored.");
    }
    if (animation) {
      warn("uni.switchTab does not support animation parameters. The animation option will be ignored.");
    }
    return uniSwitchTab(path);
  }
  if (animation) {
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

// src/state/index.ts
var START_LOCATION = createStartLocation();
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
  function resolve(location2) {
    if (typeof location2 === "string") {
      return resolveFromPath(location2);
    }
    if (isObject(location2)) {
      if ("name" in location2) {
        return resolveFromName(location2);
      }
      if ("path" in location2) {
        return resolveFromPathRaw(location2);
      }
    }
    throw new RouterError("ROUTE_NOT_FOUND" /* ROUTE_NOT_FOUND */, `Invalid route location: ${JSON.stringify(location2)}`);
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
  function resolveFromPathRaw(location2) {
    const normalizedPath = normalizePath(location2.path);
    const config = pathMap.get(normalizedPath);
    const query = serializeQuery(location2.query);
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
  function resolveFromName(location2) {
    const config = nameMap.get(location2.name);
    if (!config) {
      if (strict) {
        throw new RouterError("ROUTE_NOT_FOUND" /* ROUTE_NOT_FOUND */, `Route name "${location2.name}" not found`);
      }
      warn(`Route name "${location2.name}" not found`);
      const query2 = serializeQuery(location2.query);
      const path = `/${location2.name}`;
      const params2 = extractParams(query2);
      return createRouteLocation({
        path,
        meta: {},
        query: query2,
        fullPath: buildFullPath(path, query2),
        params: params2
      });
    }
    const query = serializeQuery(location2.query);
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

// src/router/plugin-hooks.ts
var PluginHookManager = class {
  constructor(deps) {
    __publicField(this, "deps", deps);
    __publicField(this, "enrichLocationHooks", []);
    __publicField(this, "afterResolveHooks", []);
    __publicField(this, "prepareNavigationHooks", []);
    __publicField(this, "completeNavigationHooks", []);
    __publicField(this, "navigationAbortHooks", []);
    __publicField(this, "routeSyncHooks", []);
    __publicField(this, "appInstallHooks", []);
    __publicField(this, "installedPlugins", /* @__PURE__ */ new Set());
  }
  /**
   * 安装插件并注册 hook
   */
  install(plugins, options) {
    const deps = this.deps;
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
        return deps.getCurrentRoute();
      },
      resolve: (location2) => deps.resolve(location2),
      get router() {
        return deps.router;
      },
      get paramsManager() {
        return deps.paramsManager;
      },
      hasPlugin: (name) => this.installedPlugins.has(name)
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
   * 检查指定插件是否已注册
   */
  hasPlugin(name) {
    return this.installedPlugins.has(name);
  }
  /**
   * 执行 enrichLocation hooks，返回增强后的路由位置
   */
  enrichLocation(location2) {
    let result = location2;
    for (const hook of this.enrichLocationHooks) result = hook(result);
    return result;
  }
  /**
   * 执行 afterResolve hooks，将插件数据提取到 pluginData
   */
  afterResolve(enrichedLocation, pluginData) {
    for (const hook of this.afterResolveHooks) hook(enrichedLocation, pluginData);
  }
  /**
   * 执行 prepareNavigation hooks，修改导航 query 与选项
   */
  prepareNavigation(ctx) {
    for (const hook of this.prepareNavigationHooks) hook(ctx);
  }
  /**
   * 执行 completeNavigation hooks，扩展导航结果
   */
  completeNavigation(ctx) {
    for (const hook of this.completeNavigationHooks) hook(ctx);
  }
  /**
   * 执行所有 abort hooks（导航中止或失败时清理插件资源）
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
   * 执行 routeSync hooks，从 URL query 提取插件数据到 params
   */
  runRouteSyncHooks(query, params) {
    for (const hook of this.routeSyncHooks) hook(query, params);
  }
  /**
   * 执行 appInstall hooks
   */
  runAppInstallHooks(app) {
    for (const hook of this.appInstallHooks) hook(app);
  }
};

// src/router/back-guard.ts
function getHashPath(hash) {
  return hash.replace(/^#\/?/, "/").split("?")[0];
}
var BackGuardManager = class {
  constructor(deps) {
    __publicField(this, "deps", deps);
    /** 返回守卫执行中标记：路由器发起返回时置位，避免递归 */
    __publicField(this, "backGuardRunning", false);
    /** H5 平台返回守卫：当前页面 URL，用于判断 popstate 是否为后退 */
    __publicField(this, "h5BackUrl", "");
    /** H5 平台：路由器发起的返回进行中（时间窗口内放行所有 popstate，防止死循环） */
    __publicField(this, "h5ReturningBack", false);
    /** H5 平台：路由器发起的返回目标路径（如 '/pages/test/test'），命中即视为返回完成 */
    __publicField(this, "h5ReturnTarget", null);
    /** H5 平台：返回进行中标志的自动复位定时器（兜底） */
    __publicField(this, "h5Timer", null);
  }
  /**
   * 设置 H5 平台当前页面 URL（install 时初始化）
   *
   * 作为 popstate 后退判断的基准：URL 变化说明发生了后退。
   *
   * @param url - 当前页面 URL
   */
  setH5BackUrl(url) {
    this.h5BackUrl = url;
  }
  /**
   * 标记路由器发起的返回
   *
   * 供 `router.back()` 在执行 `uni.navigateBack` 前置位，避免再次触发返回守卫。
   *
   * @param running - 是否处于路由器发起的返回中
   */
  setRouterBackRunning(running) {
    this.backGuardRunning = running;
  }
  /**
   * 标记一次 H5 返回开始（router.back() / executeBack 发起 navigateBack 前调用）
   *
   * 在时间窗口内将 {@link handleH5PopState} 对 popstate 的「撤销 + 返回守卫」处理抑制
   * 为「放行并更新基准 URL」，避免 navigateBack 产生的（可能多次的）popstate 被误判为
   * 外部后退而反复「撤销 + 重放」，形成相邻页面死循环闪烁。窗口结束自动复位。
   * 仅 H5 平台需要；App 端由 onBackPress + `backGuardRunning` 处理。
   */
  beginH5Back(targetPath) {
    if (!getPlatform().isH5) return;
    this.h5ReturningBack = true;
    this.h5ReturnTarget = targetPath ?? null;
    if (this.h5Timer) clearTimeout(this.h5Timer);
    this.h5Timer = setTimeout(() => {
      this.h5ReturningBack = false;
      this.h5ReturnTarget = null;
      this.h5Timer = null;
    }, 500);
  }
  /**
   * 处理页面 onBackPress 生命周期（由全局 mixin 注入到每个页面）
   *
   * 覆盖 App 端物理返回键、顶部导航栏返回按钮、外部 `uni.navigateBack` 调用。
   * 返回 `true` 阻止默认返回并异步执行返回守卫链；返回 `false` / `undefined` 放行默认返回。
   *
   * **递归保护**：路由器发起的返回（`router.back()` 或守卫放行后的手动返回）会再次触发
   * `onBackPress`，通过 `backGuardRunning` 标记放行，避免守卫重复执行与死循环。
   *
   * **平台限制**：仅 App 平台接入。iOS 侧滑返回不触发 `onBackPress`，
   * 需配合 `app.setSideSlipGesture` 禁用手势后由本方法接管；
   * H5 浏览器后退由 popstate 事件接入（见 {@link handleH5PopState}），
   * 小程序返回不支持拦截。
   *
   * @returns 返回 true 阻止默认返回，返回 false / undefined 放行
   */
  handleBackPress() {
    if (!getPlatform().isApp) return void 0;
    if (this.backGuardRunning) return false;
    const pages = getCurrentPages();
    if (pages.length < 2) return false;
    this.runBackGuardFromBackPress().catch(() => {
    });
    return true;
  }
  /**
   * 由 onBackPress 触发的返回守卫流程（异步执行，App 端）
   *
   * 执行顺序：onBeforeBack → beforeEach → beforeResolve，全部放行后执行 `uni.navigateBack`。
   * 由于 `onBackPress` 必须同步返回，本方法以 fire-and-forget 方式运行；
   * 守卫放行后手动返回时会再次触发 `onBackPress`，由 `backGuardRunning` 放行。
   */
  async runBackGuardFromBackPress() {
    const from = this.deps.getCurrentRoute();
    const pages = getCurrentPages();
    const targetPage = pages[pages.length - 2];
    if (!targetPage) return;
    const to = this.deps.resolve(`/${targetPage.route}`);
    await this.runBackGuardChain(to, from, () => this.executeBack(to.path));
  }
  /**
   * H5 平台返回守卫入口（由浏览器 popstate 事件触发）
   *
   * 覆盖浏览器后退按钮 / 后退手势。popstate 触发时浏览器已完成后退，
   * 采用「撤销后退 → 执行返回守卫 → 守卫放行后重新后退」策略：
   * 1. 记录当前页 URL（`h5BackUrl`），popstate 后 URL 已变化说明发生了后退；
   * 2. `history.go(1)` 恢复当前页（触发二次 popstate，命中「回到当前页」分支放行）；
   * 3. 同步捕获 to/from 执行返回守卫链（避免依赖 uni-app 处理 popstate 后的页面栈时序）；
   * 4. 守卫放行后经 {@link executeBack} 重新后退（再次触发 popstate，由 `backGuardRunning` 放行）。
   *
   * 根页面（无上级页面）不拦截，保留浏览器默认行为（离开站点 / 回上一站点）。
   */
  handleH5PopState() {
    if (this.h5ReturningBack) {
      this.h5BackUrl = location.href;
      if (this.h5ReturnTarget && getHashPath(location.hash) === this.h5ReturnTarget) {
        this.h5ReturningBack = false;
        this.h5ReturnTarget = null;
        if (this.h5Timer) {
          clearTimeout(this.h5Timer);
          this.h5Timer = null;
        }
      }
      return;
    }
    if (this.backGuardRunning) {
      this.h5BackUrl = location.href;
      return;
    }
    if (location.href === this.h5BackUrl) return;
    const pages = getCurrentPages();
    if (pages.length < 2) return;
    history.go(1);
    const from = this.deps.getCurrentRoute();
    const targetPage = pages[pages.length - 2];
    if (!targetPage) return;
    const to = this.deps.resolve(`/${targetPage.route}`);
    this.runBackGuardChain(to, from, () => this.executeBack(to.path)).catch(() => {
    });
  }
  /**
   * 执行返回守卫链（onBeforeBack → beforeEach → beforeResolve）
   *
   * 全部放行后调用 onPass 执行真正的返回，随后同步路由状态并触发后置钩子。
   * 任一守卫返回 false 时中止（NAVIGATION_ABORTED）；重定向 / 异常行为与完整导航一致。
   *
   * @param to - 返回目标路由（上一页）
   * @param from - 当前正要离开的路由
   * @param onPass - 守卫全部放行后执行返回的回调
   */
  async runBackGuardChain(to, from, onPass) {
    const backPass = await this.deps.guardManager.runBeforeBackGuards(to, from);
    if (!backPass) {
      const failure = new NavigationFailure(to, from, "NAVIGATION_ABORTED" /* NAVIGATION_ABORTED */);
      this.deps.guardManager.runAfterGuards(to, from, failure);
      this.deps.onNavigationFailure(failure, to, from);
      return;
    }
    const beforeResult = await this.deps.guardManager.runBeforeGuards(to, from);
    const handled = this.deps.handleGuardResult(beforeResult, to, from);
    if (handled) return;
    const beforeResolveResult = await this.deps.guardManager.runBeforeResolveGuards(to, from);
    const handledResolve = this.deps.handleGuardResult(beforeResolveResult, to, from);
    if (handledResolve) return;
    await onPass();
    this.deps.syncCurrentRoute();
    this.deps.guardManager.runAfterGuards(to, from);
  }
  /**
   * 守卫放行后执行真正的返回（uni.navigateBack）
   *
   * 置位 `backGuardRunning`：App 端再次触发 onBackPress、H5 端再次触发 popstate 时据此放行，
   * 避免守卫重复执行与死循环。
   */
  async executeBack(targetPath) {
    this.backGuardRunning = true;
    this.beginH5Back(targetPath);
    try {
      await goBack(1);
    } finally {
      this.backGuardRunning = false;
    }
  }
  /**
   * 按当前路由动态设置 iOS 侧滑返回手势（由全局 mixin 在页面 onShow 时调用）
   *
   * 通过 `app.setSideSlipGesture` 回调决定当前页面的 popGesture：
   * - `'none'`：禁用侧滑返回，使侧滑返回无法绕过守卫（配合 onBackPress 拦截）
   * - `'close'`：开启原生侧滑返回，保留原生手势体验（侧滑不经过守卫）
   *
   * 仅 iOS 平台生效；未配置 `app.setSideSlipGesture` 时不干预手势。
   */
  applySideSlipGesture() {
    const config = this.deps.options?.app?.setSideSlipGesture;
    if (typeof config !== "function" || !getPlatform().isIOS) return;
    const value = config(this.deps.getCurrentRoute());
    if (value === "none" || value === "close") {
      plus.webview.currentWebview()?.setStyle({ popGesture: value });
    }
  }
};

// src/router/index.ts
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
    __publicField(this, "pluginHooks");
    __publicField(this, "backGuard");
    this.guardManager = createGuardManager(options.guardTimeout);
    this.paramsManager = createParamsManager(false);
    this.matcher = createRouteMatcher(options.routes, options.strict ?? true, this.paramsManager);
    this.routeState = createRouteState(options.readyTimeout);
    this.pluginHooks = new PluginHookManager({
      getCurrentRoute: () => this.routeState.getCurrentRoute(),
      resolve: (location2) => this.matcher.resolve(location2),
      router: this,
      paramsManager: this.paramsManager
    });
    this.pluginHooks.install(options.plugins ?? [], options);
    this.routeSync = createRouteSync(
      this.routeState,
      this.matcher,
      () => this.paramsManager.cleanupStale(),
      (query, params) => this.pluginHooks.runRouteSyncHooks(query, params)
    );
    this.backGuard = new BackGuardManager({
      guardManager: this.guardManager,
      options,
      getCurrentRoute: () => this.routeState.getCurrentRoute(),
      resolve: (path) => this.matcher.resolve(path),
      syncCurrentRoute: () => this.routeSync.syncCurrentRoute(),
      handleGuardResult: (result, to, from) => this.handleGuardResult(result, to, from, "back", 0, {}),
      onNavigationFailure: (failure, to, from) => this.triggerErrorHandlers(failure, to, from)
    });
    this.paramsManager.cleanupAll();
    this.initRoute();
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
  push(location2) {
    return this.performNavigation(location2, "push");
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
  replace(location2) {
    return this.performNavigation(location2, "replace");
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
  relaunch(location2) {
    return this.performNavigation(location2, "relaunch");
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
    if (options && "animation" in options && !this.pluginHooks.hasPlugin("animation")) {
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
    const backPass = await this.guardManager.runBeforeBackGuards(to, from);
    if (!backPass) {
      return this.failNavigation(to, from, "NAVIGATION_ABORTED" /* NAVIGATION_ABORTED */);
    }
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
      // meta.animation 需要 AnimationPlugin（未注册时不生效，与 location.animation 门控一致）
      animation: this.pluginHooks.hasPlugin("animation") ? to.meta.animation : void 0
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
    this.pluginHooks.prepareNavigation(prepareCtx);
    const animation = navOptions.animation;
    this.backGuard.setRouterBackRunning(true);
    this.backGuard.beginH5Back(to.path);
    try {
      await goBack(delta, animation);
      this.routeSync.syncCurrentRoute();
      this.guardManager.runAfterGuards(to, from);
      return this.routeState.getCurrentRoute();
    } catch (error) {
      this.pluginHooks.runAbortHooks(pluginData);
      return this.failNavigation(to, from, "NAVIGATION_API_ERROR" /* NAVIGATION_API_ERROR */, void 0, isUniApiError(error) ? error : void 0);
    } finally {
      this.backGuard.setRouterBackRunning(false);
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
   * 注册全局返回守卫，在返回操作触发时执行
   *
   * 覆盖 App 端物理返回键、顶部导航栏返回按钮、`uni.navigateBack`
   * （通过全局 mixin 的 onBackPress 接入，见 {@link handleBackPress}），
   * 以及 H5 端浏览器后退按钮 / 后退手势（通过 popstate 事件接入，见 {@link handleH5PopState}）。
   * 支持异步（Promise），返回 `false` 阻止返回，`true` / `undefined` 放行。
   *
   * @param guard - 返回守卫函数
   * @returns 用于移除此守卫的函数
   */
  onBeforeBack(guard) {
    return this.guardManager.onBeforeBack(guard);
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
    return this.pluginHooks.hasPlugin(name);
  }
  /**
   * 解析路由位置为完整的 RouteLocation 对象，不执行导航
   * @param location - 原始路由位置
   * @returns 解析后的路由位置
   * @throws {RouterError} 严格模式下未找到路由时抛出
   */
  resolve(location2) {
    return this.matcher.resolve(location2);
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
   * 处理页面 onBackPress 生命周期（由全局 mixin 注入到每个页面）
   *
   * 委托给 {@link BackGuardManager}，覆盖 App 端物理返回键 / 导航栏返回 / navigateBack。
   *
   * @returns 返回 true 阻止默认返回，返回 false / undefined 放行
   */
  handleBackPress() {
    return this.backGuard.handleBackPress();
  }
  /**
   * 按当前路由动态设置 iOS 侧滑返回手势（由全局 mixin 在页面 onShow 时调用）
   *
   * 委托给 {@link BackGuardManager}，需配置 `app.setSideSlipGesture`，仅 iOS 生效。
   */
  applySideSlipGesture() {
    this.backGuard.applySideSlipGesture();
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
  async guardRoute(location2, options) {
    const target = location2 ? this.matcher.resolve(location2) : this.routeState.getCurrentRoute();
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
    this.pluginHooks.runAppInstallHooks(app);
    const router = this;
    app.mixin({
      onShow() {
        router.syncRoute();
        router.applySideSlipGesture();
      },
      onBackPress() {
        return router.handleBackPress();
      }
    });
    if (getPlatform().isH5) {
      this.backGuard.setH5BackUrl(location.href);
      window.addEventListener("popstate", () => this.backGuard.handleH5PopState());
    }
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
  async performNavigation(location2, mode) {
    if (this.pendingNavigation) {
      await this.pendingNavigation.catch(() => {
      });
    }
    this.requirePluginForLocation(location2);
    const enrichedLocation = this.pluginHooks.enrichLocation(location2);
    const to = this.matcher.resolve(enrichedLocation);
    const from = this.routeState.getCurrentRoute();
    const pluginData = {};
    this.pluginHooks.afterResolve(enrichedLocation, pluginData);
    if (mode === "push" && isSameRouteLocation(to, from)) {
      this.pluginHooks.runAbortHooks(pluginData);
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
      this.pluginHooks.runAbortHooks(pluginData);
      return this.failNavigation(to, from, "NAVIGATION_CANCELLED" /* NAVIGATION_CANCELLED */, `Maximum redirect depth (${MAX_REDIRECT_DEPTH}) exceeded`);
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
        // meta.animation 需要 AnimationPlugin（与 location.animation 的 PLUGIN_REQUIRED 门控保持一致），未注册时不生效
        animation: this.pluginHooks.hasPlugin("animation") ? to.meta.animation : void 0
      };
      const prepareCtx = {
        to,
        from,
        mode,
        pluginData,
        query: queryWithKeys,
        options: navOptions
      };
      this.pluginHooks.prepareNavigation(prepareCtx);
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
      this.pluginHooks.completeNavigation(completeCtx);
      return result;
    } catch (error) {
      this.routeState.setCurrentRoute(from);
      this.pluginHooks.runAbortHooks(pluginData);
      return this.failNavigation(to, from, "NAVIGATION_API_ERROR" /* NAVIGATION_API_ERROR */, void 0, isUniApiError(error) ? error : void 0);
    }
  }
  /**
   * 处理守卫执行结果
   *
   * 根据守卫返回的结果决定后续行为：
   * - abort: 中止导航并抛出 NavigationFailure
   * - allow + redirect: 递归执行重定向导航
   * - allow: 继续执行后续守卫
   */
  handleGuardResult(result, to, from, mode, redirectDepth, pluginData) {
    if (result.type === "abort") {
      this.pluginHooks.runAbortHooks(pluginData);
      return this.failNavigation(to, from, result.code);
    }
    if (result.redirect) {
      const enrichedRedirect = this.pluginHooks.enrichLocation(result.redirect);
      const redirectTarget = this.matcher.resolve(enrichedRedirect);
      const redirectPluginData = { ...pluginData };
      this.pluginHooks.afterResolve(enrichedRedirect, redirectPluginData);
      const redirectMode = result.mode ?? (mode === "back" ? "relaunch" : mode);
      return this.executeNavigation(redirectTarget, from, redirectMode, redirectDepth + 1, redirectPluginData);
    }
    return null;
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
    this.pluginHooks.runRouteSyncHooks(query, params);
    const fullPath = buildFullPath(to.path, query);
    return createRouteLocation({ ...to, query, fullPath, params: Object.keys(params).length > 0 ? params : void 0 });
  }
  /**
   * 检查路由位置是否使用了插件功能但未安装对应插件
   *
   * 当用户传入 params / events / animation 但对应插件未注册时，
   * 抛出 PLUGIN_REQUIRED 错误，帮助用户快速定位问题。
   */
  requirePluginForLocation(location2) {
    if (typeof location2 === "string") return;
    const loc = location2;
    if ("params" in loc && loc.params && !this.pluginHooks.hasPlugin("params")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "ParamsPlugin is required to use params. Add ParamsPlugin to createRouter({ plugins: [ParamsPlugin] }).");
    }
    if ("events" in loc && loc.events && !this.pluginHooks.hasPlugin("channel")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "ChannelPlugin is required to use events. Add ChannelPlugin to createRouter({ plugins: [ChannelPlugin] }).");
    }
    if ("animation" in loc && loc.animation && !this.pluginHooks.hasPlugin("animation")) {
      throw new RouterError("PLUGIN_REQUIRED" /* PLUGIN_REQUIRED */, "AnimationPlugin is required to use animation. Add AnimationPlugin to createRouter({ plugins: [AnimationPlugin] }).");
    }
  }
  /**
   * 构造导航失败并统一处理：触发 afterEach + 错误处理器，然后 reject
   *
   * 复用统一错误处理样板，避免各导航分支重复构造 NavigationFailure。
   *
   * @param to - 目标路由
   * @param from - 来源路由
   * @param code - 错误码
   * @param message - 错误信息（可选）
   * @param cause - uni API 失败原因（可选，仅 NAVIGATION_API_ERROR 时存在）
   * @returns 始终 reject 的 Promise
   */
  failNavigation(to, from, code, message, cause) {
    const failure = new NavigationFailure(to, from, code, message, cause);
    this.guardManager.runAfterGuards(to, from, failure);
    this.triggerErrorHandlers(failure, to, from);
    return Promise.reject(failure);
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
function createRouter(options) {
  return new UniRouter(options);
}
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
  vue.onBeforeUnmount(remove);
}
function useLink(options) {
  const router = useRouter();
  const currentRoute = useRoute();
  const route = vue.computed(() => router.resolve(options.to));
  const href = vue.computed(() => route.value.fullPath);
  const isActive = vue.computed(() => currentRoute.value.path === route.value.path);
  const isExactActive = vue.computed(() => currentRoute.value.fullPath === route.value.fullPath);
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

// src/plugins/params/index.ts
var PLUGIN_DATA_KEY = "params";
function enrichLocationWithParams(location2, paramsManager) {
  if (typeof location2 === "string") return location2;
  const loc = location2;
  const hasParams = "params" in loc && loc.params;
  if (!hasParams || Object.keys(loc.params).length === 0) return location2;
  const params = loc.params;
  const persistent = "persistent" in loc ? loc.persistent : void 0;
  const key = paramsManager.set(params, persistent);
  return injectQueryKey(location2, PARAMS_KEY, key);
}
function extractParamsKey(location2) {
  return extractQueryKey(location2, PARAMS_KEY);
}
var ParamsPlugin = {
  name: "params",
  install(context, options) {
    const paramsManager = context.paramsManager;
    const persistent = options.paramsPersistent ?? false;
    if (persistent) {
      paramsManager.setDefaultPersistent(persistent);
    }
    context.onEnrichLocation((location2) => {
      return enrichLocationWithParams(location2, paramsManager);
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
function extractAnimation(location2) {
  if (typeof location2 === "string") return void 0;
  if (typeof location2 === "object" && "animation" in location2) return location2.animation;
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
var PLUGIN_DATA_KEY3 = "channel";
function extractEvents(location2) {
  if (typeof location2 === "string") return void 0;
  if (typeof location2 === "object" && "events" in location2) return location2.events;
  return void 0;
}
function enrichLocationWithNavId(location2, navId) {
  return injectQueryKey(location2, NAV_ID_KEY, navId);
}
function extractNavId(location2) {
  return extractQueryKey(location2, NAV_ID_KEY);
}
var ChannelPlugin = {
  name: "channel",
  install(context, options) {
    const useUniEventChannel = options.useUniEventChannel ?? false;
    if (useUniEventChannel) {
      context.onEnrichLocation((location2) => {
        const navId = generateUniqueId("nav-");
        return enrichLocationWithNavId(location2, navId);
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
exports.DEFAULT_ANIMATION_DURATION = DEFAULT_ANIMATION_DURATION;
exports.InterceptorPlugin = InterceptorPlugin;
exports.NavigationFailure = NavigationFailure;
exports.ParamsPlugin = ParamsPlugin;
exports.ROUTER_SYMBOL = ROUTER_SYMBOL;
exports.RouterError = RouterError;
exports.RouterErrorCode = RouterErrorCode;
exports.UniApiError = UniApiError;
exports.UniEventChannel = UniEventChannel;
exports.createRouter = createRouter;
exports.isNavigationFailure = isNavigationFailure;
exports.noopChannel = noopChannel;
exports.onBeforeRouteLeave = onBeforeRouteLeave;
exports.useLink = useLink;
exports.usePageChannel = usePageChannel;
exports.useRoute = useRoute;
exports.useRouter = useRouter;
