# 插件系统

Uni Router 采用**核心 + 插件**架构：核心仅提供 uni-app 原生导航能力，扩展功能（参数传递、导航动画、页面间通信、API 拦截）通过插件提供，用户按需引入。

## 设计理念

Uni Router 的插件系统遵循以下原则：

1. **核心精简**：核心只包含路由匹配、导航执行、守卫链、状态同步等 uni-app 原生支持的能力
2. **插件扩展**：所有非原生能力均通过插件提供，用户显式注册后才生效
3. **零侵入**：未注册插件时，插件依赖字段（`params`/`animation`/`events` 等）的类型声明仍然存在，提供完整类型提示；运行时使用则抛出 `PLUGIN_REQUIRED` 错误
4. **可组合**：插件按数组顺序安装，通过 hook 注入导航流程，插件间通过 `pluginData` 共享数据

## 内置插件

| 插件 | name | 功能 | 对应选项 |
| --- | --- | --- | --- |
| `ParamsPlugin` | `'params'` | 页面参数传递（`params`/`persistent`） | `paramsPersistent` |
| `AnimationPlugin` | `'animation'` | 导航动画（App 端） | — |
| `ChannelPlugin` | `'channel'` | 页面间通信 + `usePageChannel()` | `useUniEventChannel` |
| `InterceptorPlugin` | `'interceptor'` | 拦截 uni 原生导航 API | `interceptUniApi` |

## 注册插件

在 `createRouter()` 的 `plugins` 选项中注册：

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [
    ParamsPlugin,      // 启用 params 参数传递
    AnimationPlugin,   // 启用导航动画
    ChannelPlugin,     // 启用页面间通信
    InterceptorPlugin  // 启用 API 拦截
  ],
  // 插件对应的选项
  paramsPersistent: true,      // 需要 ParamsPlugin
  useUniEventChannel: true,    // 需要 ChannelPlugin
  interceptUniApi: true        // 需要 InterceptorPlugin
})
```

::: warning 选项与插件配合
`paramsPersistent`/`useUniEventChannel`/`interceptUniApi` 选项需要对应插件已注册才生效。若设置了选项但未注册插件，路由器会输出警告。
:::

### 按需引入

只需注册你使用的插件：

```ts
// 只需要参数传递和 API 拦截
const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, InterceptorPlugin],
  paramsPersistent: true,
  interceptUniApi: true
})
```

## 插件依赖检查

### 运行时错误

使用插件依赖功能但未注册插件时，路由器抛出 `PLUGIN_REQUIRED` 错误：

```ts
// 未注册 ParamsPlugin
await router.push({ path: '/detail', params: { id: 123 } })
// → 抛出 NavigationFailure (PLUGIN_REQUIRED)
```

### 选项级警告

设置插件选项但未注册对应插件时，路由器输出警告：

```ts
const router = createRouter({
  routes: [...],
  // 未注册 ParamsPlugin，但设置了 paramsPersistent
  paramsPersistent: true
})
// → 警告: options.paramsPersistent is set but ParamsPlugin is not registered
```

### hasPlugin() 检查

`Router` 实例提供 `hasPlugin()` 方法，用于运行时检查插件是否注册：

```ts
if (router.hasPlugin('params')) {
  // 安全使用 params 功能
  await router.push({ path: '/detail', params: { id: 123 } })
}
```

## 插件 Hook

每个插件通过 `PluginContext` 注册 hook 到导航流程的不同阶段：

| Hook | 时机 | 用途 |
| --- | --- | --- |
| `onEnrichLocation` | matcher.resolve 前 | 注入内部 key 到 query |
| `onAfterResolve` | resolve 后、守卫前 | 从增强位置提取插件数据 |
| `onPrepareNavigation` | uni API 调用前 | 修改导航 URL query 和选项 |
| `onCompleteNavigation` | uni API 调用成功后 | 扩展 NavigationResult |
| `onNavigationAbort` | 导航中止/失败时 | 执行清理操作 |
| `onRouteSync` | syncCurrentRoute 期间 | 从 URL query 重建插件数据 |
| `onAppInstall` | router.install() 时 | 注册 app 级清理逻辑 |

## 各插件详解

### ParamsPlugin

提供页面参数传递能力，突破 uni-app 仅支持 URL query 的限制。

**启用后的功能：**
- `RouteLocationRaw.params` — 传递任意 JSON 可序列化数据
- `RouteLocationRaw.persistent` — 持久化参数到 storage
- `RouterOptions.paramsPersistent` — 全局默认持久化

**原理：** 将 params 存入内存 Map，通过 `__params_key` 注入 URL query；目标页面通过 key 从 Map 取出。详见[参数传递](./navigation#特殊用法-params-传递复杂数据)。

### AnimationPlugin

提供 App 端自定义导航动画能力。

**启用后的功能：**
- `RouteLocationRaw.animation` — 导航时指定动画
- `router.back(delta, animation)` — 返回时指定动画

**优先级：** 调用时传入 > `meta.animation` > uni 默认值

### ChannelPlugin

提供页面间双向通信能力。

**启用后的功能：**
- `RouteLocationRaw.events` — 监听目标页面事件
- `NavigationResult.eventChannel` — 与目标页面通信（`useUniEventChannel: true` 时所有导航方式均可用）
- `usePageChannel()` — 目标页面获取通信通道

**两种模式：**
- 默认模式：仅 `push` 使用原生 EventChannel
- `useUniEventChannel: true`：所有导航方式使用内置通信管理器

详见[页面间通信](./navigation#特殊用法-页面间通信)和[拦截器机制](./interceptor)。

### InterceptorPlugin

提供拦截 uni 原生导航 API 的能力，确保守卫全局生效。

**启用后的功能：**
- 拦截 `uni.navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`
- 将外部调用转由路由器处理

详见[拦截器机制](./interceptor)。

## 自定义插件

插件实现 `RouterPlugin` 接口：

```ts
import type { RouterPlugin, PluginContext } from '@meng-xi/uni-router'
import type { RouterOptions } from '@meng-xi/uni-router'

const MyPlugin: RouterPlugin = {
  name: 'my-plugin',

  install(context: PluginContext, options: RouterOptions) {
    // 通过 context 注册 hook
    context.onEnrichLocation((location) => {
      // 在 resolve 前增强路由位置
      return location
    })

    context.onAfterResolve((enrichedLocation, pluginData) => {
      // resolve 后提取数据
    })

    context.onPrepareNavigation((ctx) => {
      // 修改导航选项
    })

    context.onCompleteNavigation((ctx) => {
      // 扩展导航结果
    })

    context.onNavigationAbort((pluginData) => {
      // 导航中止时清理
    })

    context.onRouteSync((query, params) => {
      // 状态同步时从 URL 重建数据
    })

    context.onAppInstall((app) => {
      // app 安装时注册清理逻辑
    })
  }
}
```

### PluginContext API

| 属性/方法 | 说明 |
| --- | --- |
| `currentRoute` | 当前路由位置（只读） |
| `resolve(location)` | 解析路由位置 |
| `router` | 路由器实例引用 |
| `paramsManager` | 核心 ParamsManager 实例 |
| `hasPlugin(name)` | 检查插件是否已注册 |
| `onEnrichLocation(hook)` | 注册增强位置 hook |
| `onAfterResolve(hook)` | 注册 resolve 后 hook |
| `onPrepareNavigation(hook)` | 注册准备导航 hook |
| `onCompleteNavigation(hook)` | 注册完成导航 hook |
| `onNavigationAbort(hook)` | 注册导航中止 hook |
| `onRouteSync(hook)` | 注册路由同步 hook |
| `onAppInstall(hook)` | 注册 app 安装 hook |

## 下一步

- [路由导航](./navigation) — 插件依赖功能的详细用法
- [拦截器机制](./interceptor) — InterceptorPlugin 深入讲解
- [错误处理](./error-handling) — PLUGIN_REQUIRED 错误码说明
- [API 参考](../api/create-router) — createRouter() 和 plugins 选项
