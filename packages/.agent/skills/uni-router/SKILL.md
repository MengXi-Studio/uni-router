---
name: uni-router
description: >
  @meng-xi/uni-router（Uni Router）开发助手。当任务涉及 uni-app（Vue 3）的路由管理时使用本技能：创建/配置路由器、路由守卫与鉴权、push/replace/relaunch/back 导航、params 传复杂参数、页面间通信（EventChannel / usePageChannel）、导航动画、返回拦截、路由状态同步、冷启动守卫、错误处理与 RouterErrorCode、插件系统（Params/Animation/Channel/Interceptor）、RouterLink 与 TabBar 组件、以及用 @meng-xi/vite-plugin 从 pages.json 自动生成路由配置与类型。
  关键词：uni-router、uni-app 路由、@meng-xi/uni-router、uni.navigateTo 替代、路由守卫、switchTab、页面栈。
agent_created: true
metadata:
  version: 2.7.1
  package: '@meng-xi/uni-router'
  repo: https://github.com/MengXi-Studio/uni-router
  docs: https://mengxi-studio.github.io/uni-router/
  local-source: /Users/sunkunxi/Developer/Github/uni-router
---

# Uni Router 开发助手

`@meng-xi/uni-router` 是给 **uni-app（仅 Vue 3）** 用的 vue-router 风格路由库。它在 uni-app 原生导航 API
（`uni.navigateTo` 等）之上加了一层**调度层**，提供守卫链、命名路由、meta、params、页面通信、返回拦截和结构化错误。

**边界（写码前先确认）**：它不替代 uni-app 导航机制，所有导航最终仍走原生 API，因此硬限制依然生效 ——
页面栈 10 层、`switchTab` 不支持 query、`reLaunch` 不支持动画、小程序原生返回不可拦截、不支持动态路由
`/user/:id`、无 `<router-view>`、H5 为 hash 模式。

## 先读哪篇（任务 → 文件）

`references/` 下是官方文档全量中文原文（36 篇）+ 三份提炼文件。`templates/` 是可直接复制的骨架。
**按需加载，不要一次读完。**

| 你要做的事 | 读这个 |
| --- | --- |
| 从零搭路由 | `templates/router.ts` + `templates/main.ts` + `guide/getting-started.md` |
| 确认某个 API 存不存在、默认值多少 | **`references/api-surface.md`**（源码级真相，优先于文档） |
| 写守卫 / 鉴权 / 重定向 / 返回拦截 | `guide/guards.md`、`references/patterns.md` |
| 报错了，不知道为什么 | **`references/troubleshooting.md`**（症状矩阵）→ `guide/faq.md` |
| 找现成业务方案（登录/权限/埋点/预取…） | **`references/patterns.md`**（15 个模式）→ `guide/recipes.md` |
| 路由表字段、分包、strict | `guide/route-config.md`、`api/type-route-config.md` |
| 导航/params/通信/动画细节 | `guide/navigation.md` |
| 从 pages.json 自动生成 + 类型提示 | `templates/vite.config.ts`、`guide/auto-generate.md` |
| 插件机制、自定义插件 | `guide/plugins.md`、`api/type-router-plugin.md` |
| 拦截原生 uni API | `guide/interceptor.md` |
| 平台差异 / 从 vue-router 迁移 | `guide/compatibility.md`、`guide/differences.md` |
| 导航到底怎么跑的（排查深层问题） | `guide/navigation-flow.md` |
| 组件 Props | `component/router-link.md`、`component/tab-bar.md`、`component/tab-bar-item.md` |
| 版本行为变更 | `changelog.md` |

检索：`grep -rn "关键词" references/` 定位后再 Read。

## 安装

```bash
pnpm add @meng-xi/uni-router                    # 运行时
pnpm add -D @dcloudio/types                     # uni 全局 API 类型
pnpm add -D @meng-xi/vite-plugin@^1.0.0         # 可选：pages.json → 路由配置 + 类型
```

- **Vue 3 Only**；`vue` 是可选 peerDependency（只有用 `useRouter()` 等组合式 API 时才需要）。
- `tsconfig.json`：`"types": ["@dcloudio/types", "@meng-xi/uni-router"]`、`moduleResolution: "bundler"`。

## 心智模型（五条）

1. **插件 = 功能开关**。核心只有基础导航；`params` / `animation` / `events` / 原生 API 拦截分别由
   `ParamsPlugin` / `AnimationPlugin` / `ChannelPlugin` / `InterceptorPlugin` 提供。未注册就用会抛
   `PLUGIN_REQUIRED`；设了 `paramsPersistent` / `useUniEventChannel` / `interceptUniApi` 却没注册插件只会告警。
   运行时探测：`router.hasPlugin('params')`。
2. **页面栈**：`push` 入栈 / `replace` 换栈顶 / `relaunch` 清栈 / `back` 出栈（栈不足抛 `NAVIGATION_CANCELLED`）；
   目标 `meta.isTab: true` 时 `push|replace|relaunch` 自动改走 `uni.switchTab`。小程序上限 10 层。
3. **守卫链**：前进 `beforeEach → beforeEnter → beforeResolve → uni API → afterEach`；
   返回 `onBeforeBack → beforeEach → beforeResolve → navigateBack → sync → afterEach`（**无 `beforeEnter`**）。
   导航串行排队，同一时刻只有一个。
4. **状态自动同步**：`app.use(router)` 注入的全局 mixin 在每个页面 `onShow` 自动 `syncRoute()`，
   **通常无需手动调用**；只在 `onLoad`（早于 `onShow`）要读路由信息时才手动调。
5. **冷启动不经过路由器**：H5 URL / 小程序场景值 / App deeplink 直达的页面守卫未执行，
   需 `router.isReady().then(() => router.guardRoute(launchPath, { onAbort }))` 补执行。

## 导航与守卫速查

```ts
router.push(location): Promise<NavigationResult>      // navigateTo / switchTab；唯一检测重复导航
router.replace(location): Promise<NavigationResult>   // redirectTo / switchTab
router.relaunch(location): Promise<NavigationResult>  // reLaunch / switchTab；不支持动画
router.back(delta?, options?): Promise<RouteLocation> // navigateBack
```

`location` 三种写法：`'pages/detail/detail'`、`'pages/detail/detail?id=1'`、
`{ name, query, params, animation, events, persistent }`。**优先命名路由**（重构友好 + `dts` 类型提示）；
`path` 与 `name` 同时给时 `name` 优先。

守卫**不用 `next()`**，用返回值：

| 返回 | 行为 |
| --- | --- |
| `undefined` / `true` | 放行 |
| `false` | 中止 → `NAVIGATION_ABORTED` |
| `'path'` / `{ name }` / `RouteLocationRaw` | 重定向，重新跑完整守卫链 |
| `{ location, mode: 'push'\|'replace'\|'relaunch' }` | 可控重定向 |
| `Error` / `throw` | 取消 → `NAVIGATION_CANCELLED` |

- 支持 async；同类型多守卫按注册顺序，任一中止/重定向后后续不执行。
- 重定向深度上限 **10**；`guardTimeout` 默认 10000ms，超时自动中止。
- `afterEach(to, from, failure)` 不参与控制，且**状态同步不触发**它 —— 监听全部变化用
  `router.onRouteChange()`，靠 `to._synced` 区分。

## 组合式 API

```ts
const router = useRouter()      // 仅 setup 内；组件外直接 import 实例，否则 SETUP_ERROR
const route  = useRoute()       // Ref<RouteLocation>；router.currentRoute 非响应式
route.value.queryInt('page', 1) // 另有 queryNumber() / queryBool()
const channel = usePageChannel()          // 需 ChannelPlugin + useUniEventChannel
onBeforeRouteLeave((to, from) => ...)     // 卸载自动移除
const { href, isActive, isExactActive, navigate } = useLink({ to: { name: 'about' } })
```

选项式 API 用 `this.$router` / `this.$route`。

## 错误处理

```ts
router.onError((error, to, from) => {})   // 全局：日志 / 埋点 / 通用 toast
try { await router.push({ name: 'detail' }) }
catch (e) {
  if (isNavigationFailure(e, RouterErrorCode.NAVIGATION_DUPLICATED)) return
}
```

| 码 | 触发 |
| --- | --- |
| `NAVIGATION_ABORTED` | 守卫 `return false` |
| `NAVIGATION_CANCELLED` | 超时 / 抛异常 / 重定向 > 10 / `back` 栈不足 |
| `NAVIGATION_DUPLICATED` | `push` 到当前位置 |
| `ROUTE_NOT_FOUND` | `strict` 下命名路由不存在 |
| `NAVIGATION_API_ERROR` | uni API 失败（`error.cause.cause.errMsg`） |
| `PLUGIN_REQUIRED` | 插件能力但插件未注册 |
| `SETUP_ERROR` | `useRouter()` 在 setup 外 / 未 `app.use(router)` |

## 高频陷阱（写码前扫一遍）

1. `path` 必须与 `pages.json` 完全一致；分包写 `分包根/页面路径`（如 `pages-sub/profile/profile`）。
2. `meta.isTab` 必须与 `tabBar.list` 一致 —— 漏设 `navigateTo` 跳 TabBar 失败，误设 `switchTab` 跳非 TabBar 失败。
3. **TabBar 页面拿不到 `query` / `params` / `animation` / `events`**（`switchTab` 无 query，`__params_key` 传不过去）。
   用 Pinia + `onShow` 传数据（`patterns.md` #7）。⚠️ `guide/navigation.md` 里"TabBar 用 params"的说法是错的。
4. `params` 需 `ParamsPlugin`；不支持函数/Symbol；默认内存态，H5 刷新丢失 → `persistent: true`。
5. 小程序原生返回**无法拦截**；能拦的场景：App 物理返回键与导航栏返回、H5 浏览器后退与手势、`router.back()`。
   iOS 侧滑默认绕过，需 `app.setSideSlipGesture(() => 'none')`。
6. **守卫里绝不 `router.push()`**（死锁），用返回值重定向。
7. `afterEach` 不覆盖状态同步，别当唯一埋点入口。
8. 冷启动 `guardRoute()` 的**第一个参数是 location**，`onLaunch` 时页面栈为空（`currentRoute` 还是 `/`），
   必须传 `options?.path` 补全的路径；冷启动无法真正阻止进入，只能 `onAbort` 里 `relaunch` 走。
9. **单例路由器**；不要在模块顶层调 `router.push()`（Vue 未挂载、页面栈为空）。
10. 栈接近 10 层改 `relaunch`；`back()` 要 `catch` 并兜底 `relaunch`。
11. 组件不随包入口导出，需按 `.vue` 路径引入或配 easycom（见 `templates/pages.json`）。
12. 自动生成项目里路由名是 `pagesIndexIndex` 这类（`nameStrategy: 'camelCase'`），手写配置别混用两种命名。

## 工作流

**新增页面**：pages.json 加页面 →（有 generateRouter 则自动重建）→ 路由表补 `meta`（`isTab` 与 tabBar 对齐）
→ 需要鉴权加 `requireAuth` → 用命名路由跳转。

**加守卫**：优先全局 `beforeEach`（返回值模式）→ 需要"仅对某路由生效"用 `beforeEnter`
→ 拦返回用 `onBeforeBack`（或组件内 `onBeforeRouteLeave`）→ 记得冷启动补 `guardRoute`。

**排查报错**：错误码定位阶段 → `troubleshooting.md` 症状矩阵 → 确认是否平台硬限制（`guide/compatibility.md`）
→ 仍不明读 `guide/navigation-flow.md` 对照时序。

## 文件地图

```
uni-router/
├── SKILL.md                  本文件（决策中枢）
├── templates/                可复制骨架：router.ts / main.ts / pages.json / vite.config.ts / router.d.ts
└── references/
    ├── api-surface.md        【源码级】导出清单、Router 方法、默认值、错误码、插件 Hook
    ├── patterns.md           15 个常用代码模式
    ├── troubleshooting.md    症状 → 原因 → 修复 矩阵
    ├── guide/  api/  component/   官方文档原文 36 篇
    └── changelog.md
```
