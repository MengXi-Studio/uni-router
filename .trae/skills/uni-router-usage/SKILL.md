---
name: uni-router-usage
description: 指导 AI 在 uni-app 项目中严格遵循 @meng-xi/uni-router（vue-router 风格路由库）的规范编写路由代码。当涉及创建页面、路由配置、push/replace/relaunch/back 导航、params 传参、events 页面通信、导航动画、返回守卫或导航报错时使用。不适用于未安装此库或非 uni-app 项目。
---

# uni-router 使用规范

本技能约束 AI 在使用 `@meng-xi/uni-router` 的 uni-app 项目中编写路由相关代码。npm 包 `@meng-xi/uni-router` 与 uni_module 版本 `mxuni-router-v2` 用法一致，下文统称 uni-router。

所有页面导航必须通过 Router 实例完成，禁止绕过库直接调用 uni 原生导航 API（见第 12 节禁止清单）。

细节按需读取：完整选项表 / 动画 18 值 / Router 方法 / usePageChannel 注意事项见 `references/api-quickref.md`；H5 限制完整表 / 冷启动恢复示例 / 分享链接 params 恢复见 `references/h5-guide.md`。

## 1. 初始化（必须遵守）

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import { createRouter, ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'
import routes from './router.config'
import App from './App.vue'

const router = createRouter({
	routes,
	// 插件按需注册，数组顺序即安装顺序
	plugins: [ParamsPlugin, AnimationPlugin, ChannelPlugin, InterceptorPlugin],
	// 拦截 uni 原生导航 API（navigateTo 等），转由路由器处理，确保守卫生效（需 InterceptorPlugin）
	interceptUniApi: true
})

export function createApp() {
	const app = createSSRApp(App)
	// 必须调用：注入全局 mixin，页面 onShow 时自动 syncRoute()
	app.use(router)
	return { app }
}
```

强制规则：

- `routes` 的 `path` 必须与 `pages.json` 中的页面声明完全一致（不带前导 `/`）；声明 `pages.json` 不存在的页面会导致导航失败
- 必须执行 `app.use(router)`，禁止在页面中手动维护路由状态同步
- 推荐搭配 `@meng-xi/vite-plugin` 自动生成 `routes` 与类型增强
- 其余选项（`strict` / `guardTimeout` / `readyTimeout` / `paramsPersistent` / `useUniEventChannel` / `app` 等）默认值与类型见 `references/api-quickref.md`

## 2. 插件与能力对应（未注册即抛 PLUGIN_REQUIRED）

| 能力 | 所需插件 | 相关选项 |
| --- | --- | --- |
| `params` 传参 / `persistent` 持久化 | `ParamsPlugin` | `paramsPersistent` |
| 导航动画 `animation` | `AnimationPlugin` | - |
| `events` 页面通信 | `ChannelPlugin` | `useUniEventChannel: true` 时所有导航方式可用 |
| 拦截 `uni.navigateTo` 等原生 API | `InterceptorPlugin` | `interceptUniApi: true` |

## 3. 四大导航方法

| 方法 | 栈操作 | uni API | 重复检测 | 动画 | 返回值 |
| --- | --- | --- | --- | --- | --- |
| `push()` | 入栈 +1 | `navigateTo` / `switchTab` | ✅ | ✅ | `Promise<NavigationResult>` |
| `replace()` | 替换栈顶 | `redirectTo` / `switchTab` | ❌ | App ✅ / H5 ❌ | `Promise<NavigationResult>` |
| `relaunch()` | 清栈重开 | `reLaunch` / `switchTab` | ❌ | ❌（硬限制） | `Promise<NavigationResult>` |
| `back()` | 出栈 -n | `navigateBack` | ❌ | ✅ | `Promise<RouteLocation>` |

- 仅 `push` 做重复导航检测（抛 `NAVIGATION_DUPLICATED`）；`replace` / `relaunch` / `back` 不检测
- `back(delta?, options?)` 支持多级返回；页面栈不足时抛 `NAVIGATION_CANCELLED`
- `NavigationResult` 继承 `RouteLocation`；`eventChannel` 默认仅 `push` 返回；并发导航自动排队

### TabBar 页面切换细节

目标路由 `meta.isTab: true` 时，`push` / `replace` / `relaunch` 底层统一转 `uni.switchTab`（全平台一致，含 H5），仅传页面 path：

- `query` / `animation` / `events` 全部被忽略并警告；`eventChannel` 为 `undefined`
- `replace()` 到 TabBar 页的语义陷阱：`switchTab` 会**关闭所有非 TabBar 页面**而非仅替换当前页——不要用 `replace` 实现"刷新 TabBar 页"

## 4. RouteLocationRaw 三种形式

```typescript
const router = useRouter()

// 字符串（可含 query，路径自动规范化补前导 /）
await router.push('pages/detail/detail?id=1&tab=info')

// 路径对象
await router.push({ path: 'pages/detail/detail', query: { id: '1' } })

// 命名对象（推荐，重构时只改路由配置中的 path）
await router.push({ name: 'detail', query: { id: '1' } })
```

## 5. 传参规范：query vs params

- `query`：进 URL，值仅支持 string / number / boolean（内部转 string）
- `params`（需 ParamsPlugin）：不进 URL，支持任意 JSON 可序列化数据；`persistent: true` 后 H5 刷新仍可读

```typescript
// 传递（需 ParamsPlugin）
await router.push({ name: 'detail', params: { info: { id: 1, tags: ['a', 'b'] } } })

// 目标页面读取
import { useRoute } from '@meng-xi/uni-router'
const route = useRoute()
route.params.info          // 对象
route.queryInt('id')       // 1（另有 queryNumber / queryBool）
```

**分享链接 / 可直达页面的数据必须走 `query`，禁止用 `params` 做数据载体**（params 存于本机，跨设备打开必丢失，方案见 `references/h5-guide.md`）。

## 6. 页面通信 events

- 默认模式：仅 `push` 支持 `events` 与 `eventChannel`，`replace` / `relaunch` 传入被忽略并警告
- 开启 `useUniEventChannel: true`（需 ChannelPlugin）：所有导航方式均支持

```typescript
// 发起方：监听目标页面发来的事件
const result = await router.push({
	name: 'detail',
	events: { accepted(data) { console.log(data) } }
})
result.eventChannel?.emit('init', { from: 'list' })
```

目标页接收：默认模式用 uni 原生 `getOpenerEventChannel()`；开启 `useUniEventChannel` 后在 `setup()` 中调 `usePageChannel()`（须 setup 内调用、自动销毁、no-op 免判空，详见 `references/api-quickref.md`）。

## 7. 导航动画（需 AnimationPlugin）

```typescript
await router.push({ name: 'detail', animation: { type: 'slide-in-right' } })
await router.back(1, { animation: { type: 'slide-out-right', duration: 500 } })
```

- 优先级：调用时传入 > `meta.animation` > uni 默认值；入栈用 `*-in` 系、出栈用 `*-out` 系
- 平台差异：App 原生动画（push / replace / back）；H5 CSS 过渡（仅 push / back）；小程序系统控制；`relaunch` 全平台不支持
- `UniAnimationType` 全部 18 值见 `references/api-quickref.md`

## 8. 守卫体系

```typescript
const router = useRouter()

// 全局前置守卫：true/undefined 放行，false 中止，返回路由位置则重定向
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		return { name: 'login' } // 重定向
	}
})

// 返回守卫：拦截 App 物理返回 / 导航栏返回 / H5 浏览器后退，支持 Promise
router.onBeforeBack((to, from) => {
	if (from.meta.requireConfirm) {
		return new Promise(resolve => {
			uni.showModal({ title: '提示', content: '确认返回？', success: res => resolve(res.confirm) })
		})
	}
})
```

- 守卫链顺序：`onBeforeBack` → `beforeEach` → `beforeEnter` → `beforeResolve` → 导航 → `afterEach`；`afterEach` 无返回值不参与流程控制
- 路由独享守卫 `beforeEnter`：配置在 `RouteConfig` 上，返回值语义与 `beforeEach` 一致（放行 / `false` 中止 / 重定向）
- 守卫重定向可指定导航方式：返回 `{ location: { name: 'login' }, mode: 'replace' }`；正常导航未指定 `mode` 时沿用本次导航方式，`guardRoute` 场景默认 `relaunch`
- `onRouteChange(to, from)`：订阅路由状态变化；`to._synced === true` 表示来自状态同步（如小程序原生返回后）而非完整导航
- 小程序原生返回不可拦截，只能 `onRouteChange` 事后处理或用自定义导航栏调 `router.back()`
- iOS 侧滑默认绕过守卫链：`app.setSideSlipGesture` 返回 `'none'` 禁用（走守卫链）/ `'close'` 保留
- `meta` 常用字段：`title` / `isTab`（必须与 pages.json 一致）/ `requireAuth` / `animation`，支持自定义扩展
- 冷启动守卫：H5 刷新 / 分享直达页面不经过守卫，App.vue `onLaunch` 中调 `guardRoute()` 补守卫链——完整示例见 `references/h5-guide.md`

## 9. 平台硬性限制（不可绕过，编码前必须检查）

| 限制 | 说明 | 应对 |
| --- | --- | --- |
| 小程序页面栈上限 10 层 | 超限后 `push` 失败抛 `NAVIGATION_API_ERROR` | 栈深 ≥8 时改用 `relaunch` 重置或 `replace` 替换 |
| `switchTab` 不支持 query | TabBar 页的 query 被忽略并警告；`params` 同样失效 | TabBar 页间传数据用全局状态（Pinia/Vuex）或 storage |
| `reLaunch` 不支持动画 | 全平台不支持，传入仅警告 | 需动画改用 `replace` |
| 小程序原生返回不可拦截 | 无 `onBackPress` / `popstate` 通道 | `onRouteChange` 事后处理或自定义导航栏 |
| H5 无法真正清空历史栈 | `relaunch` 只能 `replaceState`，浏览器后退仍可返回 | 守卫中重新鉴权或后端重定向 |
| H5 刷新丢失页面栈与非持久化 params | `getCurrentPages()` 仅剩当前页 | 关键 params 用 `persistent: true` |

## 10. H5 端限制与解决方案

- 底层 History API：`push` → `pushState`、`replace` → `replaceState`、`relaunch` → 多次 `replaceState`、`back` → `history.back()`
- 核心 3 条：① 无法清空历史栈 → 守卫重新鉴权；② 刷新丢栈丢非持久化 params → 栈深检查 / `persistent: true`；③ 刷新直达不过守卫 → `guardRoute()`
- 浏览器后退经 `popstate` 接入守卫链，`onBeforeBack` 生效；禁止手动调用 `history.*` 操作历史栈（与返回守卫冲突，v2.7.1 已修复相关竞态死循环）
- 完整限制表、冷启动恢复完整示例、分享链接 params 恢复方案见 `references/h5-guide.md`

## 11. 错误处理

```typescript
import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

try {
	await router.push({ name: 'detail' })
} catch (e) {
	if (isNavigationFailure(e, RouterErrorCode.NAVIGATION_ABORTED)) {
		// 守卫中止
	}
}
```

| 错误码 | 含义 |
| --- | --- |
| `NAVIGATION_ABORTED` | 导航被守卫中止 |
| `NAVIGATION_CANCELLED` | 导航被取消（守卫抛出异常、重定向超限、返回时页面栈不足） |
| `NAVIGATION_DUPLICATED` | 重复导航到当前位置（仅 push 检测） |
| `ROUTE_NOT_FOUND` | 未找到匹配的路由 |
| `NAVIGATION_API_ERROR` | uni 导航 API 调用失败（如页面栈超限），`failure.cause` 含原始错误 |
| `PLUGIN_REQUIRED` | 使用了插件功能但对应插件未注册 |
| `SETUP_ERROR` | 路由器初始化或使用方式错误 |

也可用 `router.onError(handler)` 全局兜底。

## 12. 禁止清单（AI 最易犯的错误）

1. 禁止直接调用 `uni.navigateTo` / `uni.redirectTo` / `uni.reLaunch` / `uni.switchTab` / `uni.navigateBack` —— 绕过守卫链；统一使用 `router.push` / `replace` / `relaunch` / `back`（开启 `interceptUniApi: true` 后原生调用也会被转由路由器处理）
2. 禁止给 TabBar 页（`meta.isTab: true`）传 `query` 或 `params` —— `switchTab` 不支持，会被静默忽略
3. 禁止在 `routes` 中声明 `pages.json` 不存在的页面，或遗漏 `pages.json` 已有页面
4. 禁止在未注册对应插件时使用 `params` / `persistent` / `animation` / `events` —— 运行时抛 `PLUGIN_REQUIRED`
5. 禁止给 `replace`（H5 端）或 `relaunch`（全平台）传 `animation` 并期待生效
6. 禁止用 `params` 传递不可 JSON 序列化的数据（函数、DOM 节点、循环引用）
7. 禁止依赖 H5 端 `relaunch` 阻止浏览器后退（History API 无法清栈，详见 `references/h5-guide.md`）
8. 禁止假设返回操作总能被拦截 —— 小程序原生返回不可拦截，iOS 侧滑默认绕过守卫
9. 禁止在 H5 端手动调用 `history.back()` / `history.forward()` / `history.go()` / `history.pushState()` 操作历史栈 —— 与库的返回守卫冲突
10. 禁止用 `params` 作为分享链接的数据载体 —— 跨设备必丢失，分享数据走 `query`

## 13. 组合式 API 与组件速查

- `useRouter()` / `useRoute()` —— 组件内获取路由器与当前路由
- `onBeforeRouteLeave((to, from) => ...)` —— 组件内离开守卫
- `usePageChannel()` —— 页面通信管理器（需 `useUniEventChannel: true`）
- `<RouterLink :to="{ name: 'about' }">关于</RouterLink>` —— 声明式导航，H5 端渲染原生 `<a>`
- `<TabBar>` / `<TabBarItem>` —— 自定义底部导航（徽标、小红点、安全区、`before-change` 切换前拦截）
- 其余方法（`resolve` / `getRoutes` / `hasRoute` / `onError` / `useLink` 等）见 `references/api-quickref.md`
