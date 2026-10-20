# Uni Router 文档参考（v2.7.1，简体中文）

来源：`/Users/sunkunxi/Developer/Github/uni-router/packages/docs/src`（与
<https://mengxi-studio.github.io/uni-router/> 同源），已剥离 VitePress frontmatter，保留正文、代码块与
`::: tip` / `::: warning` 提示块。核心包源码核对自 `packages/core/src`。

**使用顺序**：先读 `../SKILL.md`（结论 + 陷阱）→ 需要细节时按主题 Read → 也可用
`grep -rn "关键词" .` 定位。骨架代码在 `../templates/`。

## 提炼文件（优先读这三个）

| 文件 | 内容 |
| --- | --- |
| `api-surface.md` | **源码级权威清单**：包入口导出、Router 全部方法签名、`RouterOptions` 默认值、7 个错误码、插件 Hook 时序、内部 URL key、params 生命周期、导航时序要点 |
| `patterns.md` | 15 个可抄代码模式：登录认证、角色权限、离开确认、EventChannel、params、TabBar 传参、冷启动守卫、标题、埋点、栈安全导航、动画、useLink 等 |
| `troubleshooting.md` | 症状 → 原因 → 修复 矩阵（守卫 / 参数 / 导航 / 工程配置四类），排查顺序建议 |

## 指南（guide/，19 篇）

| 文件 | 内容 |
| --- | --- |
| `guide/introduction.md` | 是什么、为什么需要、架构分层、核心概念（页面栈/匹配/守卫/状态同步/冷启动）、不支持的 vue-router 特性 |
| `guide/installation.md` | 前置条件、平台支持、安装方式、TypeScript 配置、常见安装问题 |
| `guide/getting-started.md` | 六步集成：路由配置 → 注册 → 守卫 → 页面使用 → RouterLink → 冷启动守卫；含登录页完整示例 |
| `guide/route-config.md` | `RouteConfig` 字段、path/分包/name 规范、`strict` / `guardTimeout` / `readyTimeout`、与 pages.json 协作、模块化组织、常见配置错误 |
| `guide/navigation.md` | 四种导航对比、TabBar 限制、params 原理与持久化、两种页面通信模式、导航动画、并发排队、重定向深度保护、最佳实践 |
| `guide/guards.md` | 守卫全景、返回值模式、可控重定向、异步守卫与超时、`afterEach`、返回守卫 `onBeforeBack`、iOS 侧滑、`onBeforeRouteLeave`、冷启动 `guardRoute()` |
| `guide/meta.md` | `RouteMeta` 内置字段、`declare module` 类型扩展、权限/预取/埋点/缓存实战 |
| `guide/composables.md` | `useRouter` / `useRoute` / `usePageChannel` / `onBeforeRouteLeave` / `useLink` 用法与响应式细节、组件外使用、选项式 API |
| `guide/plugins.md` | 核心 + 插件架构、四个内置插件、依赖检查与 `hasPlugin()`、7 个插件 Hook、自定义插件 `PluginContext` |
| `guide/interceptor.md` | 为什么需要拦截、拦截的 5 个 API、实现原理、注意事项与副作用 |
| `guide/navigation-flow.md` | 从 `push()` 到页面展示的完整源码级流程（并发排队、`setCurrentRoute` 提前执行、`back` 独立流程、params 生命周期） |
| `guide/error-handling.md` | `RouterError` / `NavigationFailure` / `UniApiError`、7 个错误码、`onError` 与 try-catch 分工、`isNavigationFailure()`、调试技巧 |
| `guide/auto-generate.md` | `@meng-xi/vite-plugin` 的 `generateRouter`：pages.json → 路由配置 + dts 类型（含全部 13 个选项表） |
| `guide/generate-pages.md` | `generatePages`：Vue 文件 / `defineUniPage` 宏 → pages.json（反向生成） |
| `guide/generate-uni.md` | `generateUni`：页面 + 路由一条流水线 |
| `guide/compatibility.md` | 十条平台限制（栈深度、switchTab、reLaunch 动画、返回拦截、H5 路由模式、动画、TabBar 一致性、动态路由、EventChannel、冷启动）+ 跨平台建议 |
| `guide/differences.md` | 与 vue-router 的理念与 API 差异对照、迁移陷阱 |
| `guide/recipes.md` | 12 个成方案例：登录认证、角色权限、页面通信、TabBar 传参、表单离开确认、数据预取、标题、埋点、维护模式、栈深度管理、守卫组装、路由模块化 |
| `guide/faq.md` | 19 个高频问题按症状组织：守卫不生效、params 丢失、栈溢出、返回无法拦截、switchTab query 丢失、afterEach 不触发、守卫死锁、重复导航、H5 刷新 404、初始化时机、多实例冲突、类型扩展不生效等 |

## API（api/，13 篇）

| 文件 | 内容 |
| --- | --- |
| `api/create-router.md` | `createRouter(options)` 各选项详解与示例 |
| `api/router-instance.md` | Router 实例全部属性与方法：导航、守卫注册、`getRoutes` / `hasRoute` / `resolve`、`isReady`、`onRouteChange`、`onError`、`syncRoute`、`guardRoute`、`hasPlugin`、`install` |
| `api/use-router.md` | `useRouter()` 类型、调用约束、错误码 |
| `api/use-route.md` | `useRoute()` 响应式、`RouteLocation` 字段、`queryInt/Number/Bool` |
| `api/use-page-channel.md` | `usePageChannel()` 前置条件、粘性事件、与原生 EventChannel 对比 |
| `api/use-link.md` | `useLink()` 参数与返回值，自定义导航组件 |
| `api/type-router-options.md` | `RouterOptions` 全字段 + `AppRouterOptions.setSideSlipGesture` + `GuardRouteOptions` + 三套配置组合建议 |
| `api/type-route-config.md` | `RouteConfig` 类型定义 |
| `api/type-route-location.md` | `RouteLocation` / `RouteLocationRaw` / `NavigationResult` 类型定义 |
| `api/type-route-meta.md` | `RouteMeta` 与 `UniAnimationType` 全量动画取值 |
| `api/type-navigation-guard.md` | 守卫相关类型：`NavigationGuard`、`NavigationRedirect`、`BackGuard` 等 |
| `api/type-router-error.md` | 错误类与 `RouterErrorCode` 枚举 |
| `api/type-router-plugin.md` | `RouterPlugin` / `PluginContext` 类型定义 |

## 组件（component/，3 篇）

| 文件 | 内容 |
| --- | --- |
| `component/router-link.md` | RouterLink 引入方式、Props（`to` / `replace` / `relaunch` / `custom` 等）、H5 渲染 `<a>` 的语义化能力 |
| `component/tab-bar.md` | TabBar Props、插槽、徽标/小红点/安全区、切换前拦截、SCSS 与 CSS 变量主题定制 |
| `component/tab-bar-item.md` | TabBarItem Props 与用法 |

## 其他

- `changelog.md` — v1.x 到 2.7.1 的完整变更记录（排查版本相关行为时查这里）

## 文档已知不一致（已核对源码，按此修正）

1. `guide/getting-started.md` 写 `import { RouterLink } from '@meng-xi/uni-router'` —— 包入口 `src/index.ts`
   **不导出组件**。正确写法见 `component/router-link.md`：从
   `@meng-xi/uni-router/components/router-link/router-link.vue` 引入，或配 easycom / 全局注册。
2. `guide/navigation.md`「最佳实践 2」建议 TabBar 页面用 `params` 传参，与同文「params 的局限 2」及
   `guide/recipes.md`「TabBar 页面数据传递」冲突。因 `switchTab` 不支持 query，`__params_key` 无法传递，
   实际拿不到 —— 用 Pinia + `onShow`。
3. 冷启动示例中"必须传入 `options.path`"的表述易误读：`guardRoute(location?, options?)` 的
   **第一个参数才是 location**，`options` 只有 `onAbort`。正确写法是 `router.guardRoute(launchPath, { onAbort })`。
