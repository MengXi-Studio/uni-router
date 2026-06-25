# 介绍

::: warning Vue 3 Only
Uni Router 仅支持 uni-app 的 **Vue 3** 版本，不支持 Vue 2。核心功能依赖 Composition API（`inject` / `ref`）、`app.provide`、`<script setup>` 等特性。
:::

## 它是什么

Uni Router 是一个为 [uni-app](https://uniapp.dcloud.net.cn/) 设计的路由管理库，在 uni-app 原生导航 API 之上封装了一层，提供 [vue-router](https://router.vuejs.org/) 风格的 API 体验。

## 为什么需要它

uni-app 原生使用 `uni.navigateTo`、`uni.redirectTo`、`uni.switchTab` 等 API 进行页面跳转，存在以下痛点：

| 痛点 | 原生方案 | Uni Router 方案 |
| --- | --- | --- |
| 缺乏路由守卫 | 无法在导航前拦截 | `beforeEach` / `beforeResolve` / `afterEach` |
| 无路由元信息 | 无法为路由附加属性 | `meta` 字段，支持自定义扩展 |
| API 碎片化 | 手动判断 navigateTo / switchTab | 根据 `meta.isTab` 自动选择 |
| 缺少组合式 API | 无法在 setup 中获取路由 | `useRouter()` / `useRoute()` |
| 错误处理不统一 | 回调式，无结构化错误码 | `NavigationFailure` + 错误码 |
| 参数传递受限 | 仅支持 URL query | `params` 支持复杂数据 + 持久化 |

## 架构概览

理解 Uni Router 的架构，有助于你后续掌握它的所有功能。

```
┌─────────────────────────────────────────────────────┐
│                   你的应用代码                        │
│         router.push() / useRouter() / ...            │
├─────────────────────────────────────────────────────┤
│                   Uni Router                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  导航方法  │  │  路由守卫  │  │  组合式 API / 插件 │  │
│  │ push 等   │→│ beforeEach│  │  useRouter 等     │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │             │                                │
│  ┌────▼─────────────▼────┐  ┌───────────────────┐   │
│  │     导航执行引擎        │  │   路由匹配器       │   │
│  │ 守卫链 → API 调用 → 状态│  │  path / name 匹配 │   │
│  └────────┬──────────────┘  └───────────────────┘   │
│           │                                          │
│  ┌────────▼──────┐  ┌────────────┐  ┌────────────┐  │
│  │  拦截器(可选)   │  │  参数管理   │  │  状态同步   │  │
│  │ interceptUniApi│  │ params Map │  │ syncRoute  │  │
│  └───────────────┘  └────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────┤
│              uni-app 原生导航 API                    │
│     uni.navigateTo / redirectTo / switchTab / ...    │
├─────────────────────────────────────────────────────┤
│              uni-app 页面栈（pages.json 声明）        │
└─────────────────────────────────────────────────────┘
```

### 分层职责

1. **应用层**：你的代码调用 `router.push()` 等 API
2. **Uni Router 层**：守卫链调度、路由匹配、状态管理、参数传递
3. **uni-app 层**：实际执行页面跳转的原生 API
4. **页面栈**：uni-app 框架管理的页面栈，由 `pages.json` 静态声明

::: tip 关键认知
Uni Router **不替代** uni-app 的导航机制，而是在其之上增加了一层"调度层"。所有导航最终仍通过 `uni.navigateTo` 等 API 执行，因此 uni-app 的所有限制（如 `switchTab` 不支持 query）依然存在，Uni Router 只是在这些限制之上做了优雅的封装和提示。
:::

## 核心概念

### 页面栈

uni-app 维护一个页面栈，最大深度 10 层（小程序限制）。理解页面栈是掌握 Uni Router 的基础：

| 操作 | 栈变化 | 对应 uni API |
| --- | --- | --- |
| `push()` | 入栈（+1） | `uni.navigateTo` |
| `replace()` | 替换栈顶 | `uni.redirectTo` |
| `relaunch()` | 清空栈后入栈 | `uni.reLaunch` |
| `back()` | 出栈（-n） | `uni.navigateBack` |
| TabBar 切换 | 关闭非 Tab 页 | `uni.switchTab` |

::: warning 页面栈深度限制
小程序平台页面栈最大深度为 **10 层**。超过限制后 `navigateTo` 会失败。Uni Router 无法突破此限制，建议使用 `relaunch()` 重置栈，或用 `back()` 返回后再 `push()`。
:::

### 路由匹配

Uni Router 支持两种匹配方式：

- **路径匹配**：`router.push({ path: 'pages/about/about' })`
- **名称匹配**：`router.push({ name: 'about' })`

路径会自动规范化（补全前导 `/`）。名称匹配更安全，重构时只需修改路由配置。

::: info 与 vue-router 的区别
uni-app 的页面路径在编译时由 `pages.json` 确定，**不支持动态路由**（如 `/user/:id`）。如需传递参数，使用 `query` 或 `params`。
:::

### 路由守卫

守卫是 Uni Router 的核心能力，允许在导航前后插入逻辑：

```
导航触发
  → beforeEach（全局前置）
  → beforeEnter（路由独享）
  → beforeResolve（全局解析）
  → uni API 调用
  → afterEach（全局后置）
```

守卫可通过 `next()` 放行、`next(false)` 中止、`next(location)` 重定向。详见[路由守卫](./guards)。

### 状态同步

由于物理返回键和浏览器后退**不经过路由器**，路由器的 `currentRoute` 可能与实际页面不同步。Uni Router 提供 `syncRoute()` 方法从页面栈读取真实状态并更新。

```
用户按物理返回键
  → uni-app 原生 navigateBack（不经过路由器）
  → 路由器 currentRoute 仍是旧值
  → 页面 onShow 中调用 syncRoute()
  → currentRoute 更新为真实页面
```

::: warning 这是 uni-app 的固有限制
路由器无法拦截物理返回键和浏览器后退。必须在页面的 `onShow` 生命周期中调用 `syncRoute()` 来保持状态一致。详见[平台兼容性](./compatibility)。
:::

## 设计哲学

1. **不替代，而是增强**：Uni Router 不绕过 uni-app 的导航机制，所有导航最终走原生 API。这保证了跨平台兼容性，也意味着 uni-app 的限制依然生效。

2. **静态页面模型**：uni-app 采用 `pages.json` 静态声明页面，Uni Router 尊重这一模型，不提供动态路由注册（`addRoute` / `removeRoute`）。

3. **渐进式采用**：你可以只使用 `push` / `replace` 基础导航，也可以启用守卫、拦截器、参数传递等高级功能。`interceptUniApi` 默认关闭，不影响现有代码。

4. **类型安全**：通过 `@meng-xi/vite-plugin` 的 `dts` 功能，路由名称和路径可获得自动补全和类型检查。

## 核心特性一览

- 🧭 **四种导航** — `push` / `replace` / `relaunch` / `back`，自动识别 TabBar 页面
- 🛡️ **完整守卫链** — `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- 🔄 **可控重定向** — 守卫中 `next(location, { mode })` 指定重定向方式
- 📦 **页面参数** — `params` 传递复杂数据，不暴露 URL，支持持久化
- 🔢 **查询增强** — `queryInt()` / `queryNumber()` / `queryBool()` 类型解析
- 📡 **页面通信** — `events` + `eventChannel` 双向通信
- � **导航动画** — App 端自定义动画，路由级默认值
- 🪝 **组合式 API** — `useRouter()` / `useRoute()` 响应式访问
- ⚡ **API 拦截** — 可选拦截原生导航 API，统一守卫流程
- 🛡️ **超时保护** — `guardTimeout` / `readyTimeout` 防止挂起
- 💪 **TypeScript** — 完整类型定义 + 智能提示

## 它不是什么

由于 uni-app 框架限制，以下 vue-router 特性**不支持**：

| 特性 | 原因 |
| --- | --- |
| 动态路由注册（`addRoute` / `removeRoute`） | uni-app 页面由 `pages.json` 静态声明 |
| 嵌套路由（`<router-view>`） | uni-app 无嵌套视图组件 |
| 动态路径匹配（`/user/:id`） | uni-app 页面路径固定 |
| `router.go(n)` / `router.forward()` | 小程序不支持前进导航 |
| 命名视图 | uni-app 无多视图支持 |
| 路由懒加载 | uni-app 有自己的代码分割机制 |
| History 模式选择 | uni-app 各端使用不同路由模式 |

这些限制源于 uni-app 框架本身的设计，而非本库的不足。详见[与 vue-router 的差异](./differences)。

## 下一步

- [快速开始](./getting-started) — 几分钟内集成到项目
- [路由导航](./navigation) — 深入掌握四种导航方式
- [路由守卫](./guards) — 理解守卫机制与实战
- [导航流程原理](./navigation-flow) — 从源码角度理解导航全过程
