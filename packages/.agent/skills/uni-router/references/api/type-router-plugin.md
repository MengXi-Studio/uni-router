# RouterPlugin

路由器插件接口，参考 Swiper.js 插件架构设计。每个插件通过 `install` 方法注册 hook 到 `PluginContext`，路由器在导航流程的各个阶段依次调用已注册的 hook。

## 类型定义

```ts
interface RouterPlugin {
  /** 插件名称 */
  name: string
  /**
   * 安装插件
   * @param context - 插件上下文，用于注册 hook
   * @param options - 路由器初始化选项（插件可读取自己的选项）
   */
  install(context: PluginContext, options: RouterOptions): void
}
```

## 内置插件

| 插件 | name | 说明 |
| --- | --- | --- |
| `ParamsPlugin` | `'params'` | 页面参数传递（`params`/`persistent`），详见[导航 - params](../guide/navigation#特殊用法-params-传递复杂数据) |
| `AnimationPlugin` | `'animation'` | 导航动画（App 端），详见[导航 - 动画](../guide/navigation#特殊用法-导航动画) |
| `ChannelPlugin` | `'channel'` | 页面间通信 + `usePageChannel()`，详见[导航 - 通信](../guide/navigation#特殊用法-页面间通信) |
| `InterceptorPlugin` | `'interceptor'` | 拦截 uni 原生导航 API，详见[拦截器机制](../guide/interceptor) |

## 注册方式

在 `createRouter()` 的 `plugins` 选项中注册：

```ts
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin],
  // 插件对应的选项
  paramsPersistent: true,      // 需要 ParamsPlugin
  useUniEventChannel: true,    // 需要 ChannelPlugin
  interceptUniApi: true        // 需要 InterceptorPlugin
})
```

## PluginContext

插件上下文，路由器暴露给插件的 hook 注册接口。

```ts
interface PluginContext {
  /** 在 matcher.resolve() 前增强原始路由位置 */
  onEnrichLocation(hook: (location: RouteLocationRaw) => RouteLocationRaw): void

  /** resolve 之后、守卫之前，从增强后的路由位置中提取插件数据 */
  onAfterResolve(hook: (enrichedLocation: RouteLocationRaw, pluginData: Record<string, any>) => void): void

  /** uni API 调用前，修改导航 URL query 和选项 */
  onPrepareNavigation(hook: (ctx: NavigationPrepareContext) => void): void

  /** uni API 调用成功后，扩展 NavigationResult */
  onCompleteNavigation(hook: (ctx: NavigationCompleteContext) => void): void

  /** 导航中止或失败时，执行清理操作 */
  onNavigationAbort(hook: (pluginData: Record<string, any>) => void): void

  /** syncCurrentRoute 期间，从 URL query 中提取插件数据 */
  onRouteSync(hook: (query: Record<string, string>, params: Record<string, any>) => void): void

  /** router.install() 被调用时触发 */
  onAppInstall(hook: (app: App) => void): void

  /** 当前路由位置（只读） */
  readonly currentRoute: RouteLocation

  /** 解析路由位置为完整的 RouteLocation 对象 */
  resolve(location: RouteLocationRaw): RouteLocation

  /** 路由器实例引用 */
  readonly router: Router

  /** 核心 ParamsManager 实例 */
  readonly paramsManager: ParamsManager

  /** 检查指定插件是否已注册 */
  hasPlugin(name: string): boolean
}
```

### NavigationPrepareContext

导航准备上下文，在 uni API 调用前由插件使用：

```ts
interface NavigationPrepareContext {
  /** 目标路由 */
  to: RouteLocation
  /** 来源路由 */
  from: RouteLocation
  /** 导航模式 */
  mode: 'push' | 'replace' | 'relaunch' | 'back'
  /** 插件间共享数据 */
  pluginData: Record<string, any>
  /** 实际导航 URL 的 query（可变） */
  query: Record<string, string>
  /** uni 导航选项（可变） */
  options: UniNavigationOptions
}
```

### NavigationCompleteContext

导航完成上下文，在 uni API 调用成功后由插件使用：

```ts
interface NavigationCompleteContext {
  /** 目标路由 */
  to: RouteLocation
  /** 导航模式 */
  mode: 'push' | 'replace' | 'relaunch' | 'back'
  /** 插件间共享数据 */
  pluginData: Record<string, any>
  /** 原生 eventChannel（仅 push 模式可用） */
  nativeEventChannel?: EventChannel
  /** 导航结果（可变：插件扩展） */
  result: Record<string, any>
}
```

## 自定义插件示例

```ts
import type { RouterPlugin, PluginContext } from '@meng-xi/uni-router'
import type { RouterOptions } from '@meng-xi/uni-router'

const AnalyticsPlugin: RouterPlugin = {
  name: 'analytics',

  install(context: PluginContext, options: RouterOptions) {
    // 导航完成后上报
    context.onCompleteNavigation((ctx) => {
      trackPageView(ctx.to.path, ctx.mode)
    })

    // 导航中止时上报
    context.onNavigationAbort(() => {
      trackEvent('navigation_aborted')
    })
  }
}

// 注册
const router = createRouter({
  routes: [...],
  plugins: [AnalyticsPlugin]
})
```

## 下一步

- [插件系统](../guide/plugins) — 插件架构详解
- [createRouter()](./create-router) — plugins 选项
- [Router 实例](./router-instance) — hasPlugin() 方法
