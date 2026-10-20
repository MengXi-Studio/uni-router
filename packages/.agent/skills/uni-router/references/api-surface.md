# 源码级 API 速查（v2.7.1）

本文件从 `packages/core/src` 源码提取，是**文档之外的真相来源**。当文档表述与此处冲突时，以本文件为准。
文档解释「怎么用」，本文件回答「到底有什么 / 默认值是多少」。

## 包入口导出（`src/index.ts`）

```ts
// 运行时值
createRouter, ROUTER_SYMBOL
useRouter, useRoute, onBeforeRouteLeave, useLink
ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin
usePageChannel, UniEventChannel, noopChannel
RouterError, NavigationFailure, UniApiError, isNavigationFailure, RouterErrorCode
DEFAULT_ANIMATION_DURATION

// 类型
RouteNameMap, RouteName, RoutePath, RouteMeta, RouteConfig,
RouteLocation, RouteLocationPathRaw, RouteLocationNamedRaw, RouteLocationRaw,
QueryValue, ParamValue, ParamObject, ParamsInput,
EventChannel, EventListeners, NavigationResult,
NavigationRedirectMode, NavigationRedirect,
NavigationGuard, PostNavigationGuard, RouteLeaveGuard,
BackGuardReturn, BackGuard, RouterOnError,
RouterOptions, Router, GuardRouteOptions, AppRouterOptions, SideSlipGesture,
UniApiCause, RouterPlugin, PluginContext, NavigationPrepareContext, NavigationCompleteContext,
UseLinkOptions, UseLinkReturn, NavigationAnimation, UniAnimationType
```

⚠️ **组件不在入口导出**。见 `component/router-link.md`，需按 `.vue` 路径引入或配 easycom。

## Router 实例方法（`src/types/router.ts`）

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `currentRoute` | `readonly RouteLocation` | **非响应式**，响应式请用 `useRoute()` |
| `push` | `(location) => Promise<NavigationResult>` | `navigateTo` / `switchTab`；唯一检测重复导航 |
| `replace` | `(location) => Promise<NavigationResult>` | `redirectTo` / `switchTab` |
| `relaunch` | `(location) => Promise<NavigationResult>` | `reLaunch` / `switchTab`；不支持动画 |
| `back` | `(delta = 1, options?) => Promise<RouteLocation>` | `navigateBack`；栈不足抛 `NAVIGATION_CANCELLED` |
| `beforeEach` / `beforeResolve` / `afterEach` | `(guard) => () => void` | 返回**移除函数** |
| `onBeforeBack` | `(guard) => () => void` | 返回守卫 |
| `getRoutes` | `() => RouteConfig[]` | 浅拷贝 |
| `hasRoute` | `(name: string) => boolean` | |
| `resolve` | `(location) => RouteLocation` | 只解析不导航 |
| `isReady` | `() => Promise<void>` | |
| `onRouteChange` | `(listener) => () => void` | 覆盖导航 + 状态同步 |
| `onError` | `(handler) => () => void` | |
| `syncRoute` | `() => void` | 同步页面栈；`onShow` 已由 mixin 自动调用 |
| `guardRoute` | `(location?, options?) => Promise<RouteLocation>` | 冷启动补守卫 |
| `hasPlugin` | `(name: string) => boolean` | `'params' \| 'animation' \| 'channel' \| 'interceptor'` |
| `install` | `(app) => void` | `app.use(router)` 时调用 |

### guardRoute 的关键事实（易错）

```ts
async guardRoute(location?, options?) {
  const target = location ? this.matcher.resolve(location) : this.routeState.getCurrentRoute()
  // beforeEach → beforeEnter → beforeResolve
  // 放行：不导航，resolve target
  // 中止：onAbort(failure) + reject(NavigationFailure)
  // 重定向：mode = result.mode ?? 'relaunch'
}
```

- 第一个参数是 **`location`（路径/命名路由）**，不是 options 的字段。
- `onLaunch` 时页面栈为空、`currentRoute` 仍是 `START_LOCATION`（path `/`），
  **必须显式传真实入口路径**，否则守卫校验的是 `/`。
- 守卫重定向时默认用 **`relaunch`**（不是沿用原导航方式）。
- 不执行 `afterEach`，也不执行 `back` 相关逻辑。

## RouterOptions 与默认值（`src/constants/defaults.ts`）

| 选项 | 类型 | 默认值 | 依赖插件 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | **必填** | — |
| `strict` | `boolean` | `false` | — |
| `guardTimeout` | `number` | `10000` | — |
| `readyTimeout` | `number` | `0`（永不超时） | — |
| `plugins` | `RouterPlugin[]` | `[]` | — |
| `paramsPersistent` | `boolean` | `false` | ParamsPlugin |
| `useUniEventChannel` | `boolean` | `false` | ChannelPlugin |
| `interceptUniApi` | `boolean` | `false` | InterceptorPlugin |
| `app.setSideSlipGesture` | `(to) => 'none' \| 'close'` | `undefined` | —（仅 iOS） |

其他常量：`DEFAULT_ANIMATION_DURATION = 300`、`MAX_REDIRECT_DEPTH = 10`。

## 错误码（`src/enums/router-error-code.ts`）

| 码 | 触发点 |
| --- | --- |
| `NAVIGATION_ABORTED` | 守卫 `return false` |
| `NAVIGATION_CANCELLED` | 守卫超时 / 抛异常 / 重定向深度 > 10 / `back` 栈不足 |
| `NAVIGATION_DUPLICATED` | `push` 到相同位置（比较 path + name + query） |
| `ROUTE_NOT_FOUND` | `strict: true` 下未匹配 |
| `NAVIGATION_API_ERROR` | uni API 失败（`error.cause.cause.errMsg`） |
| `PLUGIN_REQUIRED` | 用了插件能力但插件未注册 |
| `SETUP_ERROR` | `useRouter()` 在 setup 外 / 未 `app.use(router)` |

错误同时走两条路径：`onError` 全局监听 + Promise `reject`（`catch`）。

## 插件 Hook（`src/types/plugin.ts`）

插件通过 `PluginContext` 注册，按导航时序排列：

| Hook | 时机 | 典型用途 |
| --- | --- | --- |
| `onEnrichLocation` | `matcher.resolve()` **前** | 往 query 注入 `__params_key` / `__nav_id` |
| `onAfterResolve` | `resolve()` 后、守卫前 | 内部 key 被 matcher 丢弃前，提取到 `pluginData` |
| `onPrepareNavigation` | uni API 调用前 | 把内部 key 拼回真实 URL query、改 `options` |
| `onCompleteNavigation` | uni API 成功后 | 扩展 `NavigationResult`（如替换 eventChannel） |
| `onNavigationAbort` | 中止/失败 | 清理（destroyChannel） |
| `onRouteSync` | `syncCurrentRoute()` 期间 | 从 URL query 重建 params |
| `onAppInstall` | `router.install()` | 注册 app 级清理 |

`PluginContext` 还提供：`currentRoute`、`resolve()`、`router`、`paramsManager`、`hasPlugin()`。

内置插件名：`params`（ParamsPlugin）、`animation`（AnimationPlugin）、`channel`（ChannelPlugin）、`interceptor`（InterceptorPlugin）。

## 内部 URL key（`src/constants/keys.ts`）

| key | 用途 |
| --- | --- |
| `__params_key` | params 传递句柄，用户可见 `route.query` 中已移除 |
| `__nav_id` | 内置通信通道 id，同步时读取并移除 |
| `__uni_router_params__` | params 持久化 storage key 前缀 |
| `uni-router:{navId}:{event}` | 内置通道事件名格式 |

## params 生命周期

```
push({ params }) → ParamsManager.set(key) → URL 拼 ?__params_key=key
目标页首读       → get(key)（读取后删除，防重复）
back() 返回      → peek(key)（不删除，可反复返回）
页面关闭/syncRoute → cleanupStale()
路由器初始化      → cleanupAll()
```

## 导航时序要点（源码确认）

1. `performNavigation`：等待 `pendingNavigation`（串行排队）→ 处理 params → `resolve()` → 提取 animation/events → **仅 push** 做重复检测。
2. `executeNavigation`：深度检查 → `beforeEach` → `beforeEnter` → `beforeResolve` → **`setCurrentRoute(to)` 在 uni API 之前**（保证目标页 `onLoad` 读到新路由；API 失败则回滚为 `from`）→ 调 uni API → `afterEach`。
3. `back()` 走独立流程：读页面栈算目标 → `beforeEach` → `beforeResolve`（**无 `beforeEnter`**）→ `navigateBack` → `syncCurrentRoute()`（标 `_synced: true`）→ `afterEach`。
4. 重定向：`mode = 守卫指定 ?? (原 mode === 'back' ? 'relaunch' : 原 mode)`，并重新跑完整守卫链。
5. `markRouterCall()` 标记路由器发起的调用，供 InterceptorPlugin 避免循环拦截。
