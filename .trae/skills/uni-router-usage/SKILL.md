---
name: uni-router-usage
description: 指导 AI 在 uni-app 项目中严格遵循 @meng-xi/uni-router（vue-router 风格路由库）的规范编写路由代码。当涉及创建页面、路由配置、push/replace/relaunch/back 导航、params 传参、events 页面通信、导航动画、返回守卫或导航报错时使用。不适用于未安装此库或非 uni-app 项目。
---

# uni-router 使用规范

本技能约束 AI 在使用 `@meng-xi/uni-router` 的 uni-app 项目中编写路由相关代码。npm 包 `@meng-xi/uni-router` 与 uni_module 版本 `mxuni-router-v2` 用法一致，下文统称 uni-router。

所有页面导航必须通过 Router 实例完成，禁止绕过库直接调用 uni 原生导航 API（见第 12 节禁止清单）。

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

- `routes` 的 `path` 必须与 `pages.json` 中的页面声明完全一致（不带前导 `/`，如 `pages/index/index`）；声明 `pages.json` 不存在的页面会导致导航失败
- 必须执行 `app.use(router)`：注入全局 mixin 后页面 `onShow` 自动 `syncRoute()`，无需手动同步路由状态
- 推荐搭配 `@meng-xi/vite-plugin`：从 `pages.json` 自动生成 `routes` 与 `RouteNameMap` 模块增强，使 `name` / `path` 获得自动补全与类型检查
- `strict` 默认 `true`，未匹配的命名路由抛出异常

常用选项（`createRouter`）：

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | - | 路由配置，需与 `pages.json` 一致 |
| `strict` | `boolean` | `true` | 未匹配的命名路由抛出异常 |
| `guardTimeout` | `number` | `10000` | 守卫超时（ms），超时警告并自动中止导航，`0` 关闭 |
| `readyTimeout` | `number` | `0` | `isReady()` 就绪超时（ms），`0` 表示永不超时 |
| `plugins` | `RouterPlugin[]` | `[]` | 按需注册插件 |
| `paramsPersistent` | `boolean` | `false` | params 默认持久化到 storage（需 ParamsPlugin） |
| `useUniEventChannel` | `boolean` | `false` | 所有导航方式均支持页面通信（需 ChannelPlugin） |
| `interceptUniApi` | `boolean` | `false` | 拦截 uni 原生导航 API（需 InterceptorPlugin） |
| `app` | `AppRouterOptions` | - | App 专属，如 `setSideSlipGesture` 控制 iOS 侧滑返回 |

## 2. 插件与能力对应（未注册即抛 PLUGIN_REQUIRED）

| 能力 | 所需插件 | 相关选项 |
| --- | --- | --- |
| `params` 传参 / `persistent` 持久化 | `ParamsPlugin` | `paramsPersistent` |
| 导航动画 `animation` | `AnimationPlugin` | - |
| `events` 页面通信 | `ChannelPlugin` | `useUniEventChannel: true` 时所有导航方式可用 |
| 拦截 `uni.navigateTo` 等原生 API | `InterceptorPlugin` | `interceptUniApi: true` |

运行时可用 `router.hasPlugin('params' | 'animation' | 'channel' | 'interceptor')` 检查。

## 3. 四大导航方法

| 方法 | 栈操作 | uni API | 重复检测 | 动画 | 返回值 |
| --- | --- | --- | --- | --- | --- |
| `push()` | 入栈 +1 | `navigateTo` / `switchTab` | ✅ | ✅ | `Promise<NavigationResult>` |
| `replace()` | 替换栈顶 | `redirectTo` / `switchTab` | ❌ | App ✅ / H5 ❌ | `Promise<NavigationResult>` |
| `relaunch()` | 清栈重开 | `reLaunch` / `switchTab` | ❌ | ❌（硬限制） | `Promise<NavigationResult>` |
| `back()` | 出栈 -n | `navigateBack` | ❌ | ✅ | `Promise<RouteLocation>` |

规则：

- 仅 `push` 做重复导航检测（path、name、query 全匹配时抛 `NAVIGATION_DUPLICATED`）；`replace` 常用于刷新当前页、`relaunch` 用于重置页面栈（如退出登录），均不检测
- 目标路由 `meta.isTab: true` 时，`push` / `replace` / `relaunch` 自动改用 `uni.switchTab`，无需手动判断；但 query / animation / events 会被忽略（见第 9 节）
- `back(delta?, options?)` 支持多级返回：`await router.back(2, { animation: { type: 'slide-out-right', duration: 500 } })`；页面栈不足时抛 `NAVIGATION_CANCELLED`
- `NavigationResult` 继承 `RouteLocation`，可直接当 `RouteLocation` 使用；`eventChannel` 默认仅 `push` 返回
- 并发导航自动排队，无需手动防抖

### TabBar 页面切换细节

目标路由 `meta.isTab: true` 时，`push` / `replace` / `relaunch` 底层统一转 `uni.switchTab`（全平台一致，含 H5），仅传页面 path：

- `query` / `animation` / `events` 全部被忽略并输出警告；返回的 `NavigationResult.eventChannel` 为 `undefined`
- `replace()` 到 TabBar 页有语义陷阱：`switchTab` 会**关闭所有非 TabBar 页面**，而非仅替换当前页（控制台有对应警告）——不要用 `replace` 实现"刷新 TabBar 页"
- 切换完成后路由状态由全局 mixin 在目标页 `onShow` 时自动 `syncRoute()`，无需手动处理

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

- `query`：进 URL，值仅支持 string / number / boolean（内部转 string），适合简单标识
- `params`（需 ParamsPlugin）：不进 URL，支持任意 JSON 可序列化数据（对象、数组），通过内存 / storage 传递

```typescript
// 传递（需 ParamsPlugin）
await router.push({ name: 'detail', params: { info: { id: 1, tags: ['a', 'b'] } } })

// 持久化：H5 刷新后仍可读取（单次导航覆盖 paramsPersistent 全局默认）
await router.push({ name: 'detail', params: { info: { id: 1 } }, persistent: true })
```

```typescript
// 目标页面读取
import { useRoute } from '@meng-xi/uni-router'
const route = useRoute()
route.params.info          // { id: 1, tags: ['a', 'b'] }
route.query.id             // '1'（string）
route.queryInt('id')       // 1
route.queryNumber('price') // 支持浮点
route.queryBool('enabled') // 'true'/'1' → true，'false'/'0' → false
```

## 6. 页面通信 events

- 默认模式（`useUniEventChannel: false`）：仅 `push` 支持 `events` 与 `eventChannel`（走 uni 原生 EventChannel），`replace` / `relaunch` 传入 `events` 被忽略并输出警告
- 开启 `useUniEventChannel: true`（需 ChannelPlugin）：所有导航方式均支持，返回值中 `eventChannel` 均可用

```typescript
// 发起方：监听目标页面发来的事件
const result = await router.push({
	name: 'detail',
	events: {
		// 监听目标页面 eventChannel.emit('accepted', data)
		accepted(data) { console.log(data) }
	}
})
result.eventChannel?.emit('init', { from: 'list' })
```

### 目标页接收

- 默认模式：目标页通过 uni 原生 `getOpenerEventChannel()` 获取通道后 `on` 监听
- `useUniEventChannel: true` 模式：目标页在 `setup()` 中调用 `usePageChannel()`，获取与导航方共享的通道实例

```typescript
// useUniEventChannel: true 模式的目标页
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()
channel.on('init', data => console.log(data)) // 收导航方事件
channel.emit('accepted', { ok: true })        // 回发导航方
```

`usePageChannel()` 注意事项：

- 必须在组件 `setup()` 中调用，外部调用抛 `SETUP_ERROR`
- 通过 `route.params.__navId` 关联导航方创建的通道（同一 navId 复用实例）
- 页面卸载时自动销毁通道并清理所有监听器，防止内存泄漏
- 无 `__navId`（非通道导航进入）或未开启 `useUniEventChannel` 时返回 no-op 通道，调用方无需判空

## 7. 导航动画（需 AnimationPlugin）

```typescript
// NavigationAnimation: { type: UniAnimationType, duration?: number（默认 300） }
await router.push({ name: 'detail', animation: { type: 'slide-in-right' } })
await router.back(1, { animation: { type: 'slide-out-right', duration: 500 } })
```

- 优先级：调用时传入 > `meta.animation`（路由配置中的默认动画）> uni 默认值
- `UniAnimationType` 共 18 个值：`auto` / `none` / `slide-in-right` / `slide-in-left` / `slide-in-top` / `slide-in-bottom` / `slide-out-right` / `slide-out-left` / `slide-out-top` / `slide-out-bottom` / `fade-in` / `fade-out` / `zoom-out` / `zoom-in` / `zoom-fade-out` / `zoom-fade-in` / `pop-in` / `pop-out`
- 入栈动画（push）用 `*-in` 系（含 `zoom-out` / `zoom-fade-out`）；出栈动画（back）用 `*-out` 系（含 `zoom-in` / `zoom-fade-in`）
- 平台差异：App 端为原生窗口动画（push / replace / back 支持）；H5 端为 CSS 过渡（仅 push / back，replace 不支持）；小程序由系统控制，自动忽略；`relaunch` 全平台不支持动画，传入会输出警告

## 8. 守卫体系

```typescript
const router = useRouter()

// 全局前置守卫：true/undefined 放行，false 中止，返回路由位置则重定向
router.beforeEach((to, from) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		return { name: 'login' } // 重定向
	}
})

// 路由独享守卫（RouteConfig.beforeEnter）
// 组件内离开守卫
import { onBeforeRouteLeave } from '@meng-xi/uni-router'
onBeforeRouteLeave((to, from) => {
	if (hasUnsavedChanges) return false // 中止导航
})

// 返回守卫：拦截 App 物理返回键 / 导航栏返回 / navigateBack、H5 浏览器后退 / 手势
router.onBeforeBack((to, from) => {
	if (from.meta.requireConfirm) {
		// 返回 false 阻止返回；true / undefined 放行；也可返回路由位置重定向；支持 Promise
		return new Promise(resolve => {
			uni.showModal({
				title: '提示',
				content: '确认返回？',
				success: res => resolve(res.confirm)
			})
		})
	}
})

// 冷启动守卫：H5 URL / 小程序场景值 / App deeplink 直达页面时补执行守卫链
// 放在 App.vue 的 onLaunch 中
router.isReady().then(() => {
	router.guardRoute(undefined, {
		onAbort: () => router.relaunch('/pages/index/index')
	})
})
```

守卫链顺序：`onBeforeBack` → `beforeEach` → `beforeEnter` → `beforeResolve` → 导航 → `afterEach`。

- 守卫重定向可指定导航方式：返回 `{ location: { name: 'login' }, mode: 'replace' }`（`NavigationRedirect`，`mode` 支持 `push` / `replace` / `relaunch`）；正常导航中未指定 `mode` 时沿用本次导航方式，冷启动 `guardRoute` 场景默认 `relaunch`

- `afterEach(to, from)` 无返回值，不参与流程控制
- `onRouteChange(to, from)`：订阅路由状态变化（含状态同步），不参与导航流程；`to._synced === true` 表示本次变化来自状态同步（如小程序原生返回后的自动同步），而非完整导航
- 小程序原生返回（左上角返回、物理返回键、侧滑）不可拦截，只能通过 `onRouteChange` 事后处理，或改用 `navigationStyle: 'custom'` 自定义返回按钮调 `router.back()`
- iOS 侧滑返回默认绕过守卫链：用 `app.setSideSlipGesture` 按页控制，返回 `'none'` 禁用侧滑（返回走守卫链），返回 `'close'` 保留原生手势

路由配置示例：

```typescript
// src/router.config.ts
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
	{
		path: 'pages/index/index',
		name: 'index',
		meta: { title: '首页', isTab: true }
	},
	{
		path: 'pages/detail/detail',
		name: 'detail',
		meta: { title: '详情', requireAuth: true, animation: { type: 'slide-in-right' } },
		beforeEnter: (to, from) => {
			// 路由独享守卫，返回值语义与 beforeEach 一致
		}
	}
]
export default routes
```

`RouteMeta` 常用字段：`title`（页面标题）、`isTab`（是否 TabBar 页，必须与 `pages.json` 的 `tabBar.list` 一致）、`requireAuth`（需登录，常配合 `beforeEach` 鉴权）、`animation`（默认导航动画，可被调用时传入覆盖）；支持任意自定义扩展字段（如上文守卫示例中的 `requireConfirm`）。

## 9. 平台硬性限制（不可绕过，编码前必须检查）

| 限制 | 说明 | 应对 |
| --- | --- | --- |
| 小程序页面栈上限 10 层 | 超限后 `push` 失败抛 `NAVIGATION_API_ERROR` | 栈深 ≥8 时改用 `relaunch` 重置或 `replace` 替换 |
| `switchTab` 不支持 query | TabBar 页的 query 被忽略并警告；`params` 依赖 URL 中的 `__params_key`，同样失效 | TabBar 页间传数据用全局状态（Pinia/Vuex）或 storage |
| `reLaunch` 不支持动画 | 全平台不支持，传入仅警告 | 需动画改用 `replace` |
| 小程序原生返回不可拦截 | 无 `onBackPress` / `popstate` 通道 | `onRouteChange` 事后处理或自定义导航栏 |
| H5 无法真正清空历史栈 | `relaunch` 只能 `replaceState`，浏览器后退仍可返回 | 登出等场景在守卫中重新鉴权或后端重定向 |
| H5 刷新丢失页面栈与非持久化 params | `getCurrentPages()` 仅剩当前页；非 `persistent` 的 params 丢失 | 关键 params 用 `persistent: true` |

## 10. H5 端限制与解决方案

H5 端底层使用 History API，导航方法映射：`push` → `history.pushState`（新增历史记录）、`replace` → `history.replaceState`（替换当前记录）、`relaunch` → 多次 `history.replaceState`、`back` → `history.back()`。

| 限制 | 具体表现 | 解决方案 |
| --- | --- | --- |
| 无法真正清空历史栈 | `relaunch` 只能替换当前记录，用户仍可通过浏览器后退回到之前的页面（如退出登录后回到个人中心） | `beforeEach` 中重新鉴权并重定向；关键场景由后端重定向兜底 |
| 刷新后页面栈丢失 | `getCurrentPages()` 只剩当前页，`back()` 栈不足时抛 `NAVIGATION_CANCELLED` | 返回前检查栈深，栈不足时改用 `relaunch` 跳转目标页 |
| 刷新后非持久化 params 丢失 | params 存于内存 Map，刷新后清空 | 单次导航 `persistent: true`，或全局 `paramsPersistent: true` |
| `replace` / `relaunch` 无动画 | H5 动画为 CSS 过渡，仅 `push` / `back` 生效 | 需要动画效果的跳转使用 `push` / `back` |
| 刷新 / 直达 URL 不经过守卫 | 页面由框架直接加载，`beforeEach` 等守卫未执行，存在越权访问风险 | App.vue `onLaunch` 中调用 `router.guardRoute()` 补执行守卫链（完整示例见下文） |

浏览器后退与守卫（H5 特有行为）：

- 浏览器后退按钮 / 后退手势通过 `popstate` 事件接入守卫链，`onBeforeBack` 在 H5 端同样生效
- 库的处理流程：popstate 触发后先撤销本次后退（URL 弹回原页面）→ 执行守卫链 → 放行则执行返回、中止则停留在当前页
- 守卫中止返回时浏览器地址栏会短暂变化后复原，属正常现象，不要据此判断导航异常
- 禁止在业务代码中手动调用 `history.back()` / `history.forward()` / `history.go()` 操作历史栈 —— 会与库的返回守卫冲突，破坏守卫语义（库内部已处理程序化返回与浏览器后退并发的 popstate 竞态，v2.7.1 修复了由此引发的返回死循环 / 页面闪烁）

### H5 冷启动恢复完整示例

场景：H5 刷新或分享链接直达页面时，页面由 uni-app 框架直接加载、**不经过任何守卫**。恢复流程为：守卫注册（main.ts，mount 前）→ App.vue `onLaunch` 中 `isReady()` 后调用 `guardRoute()` 补执行守卫链（`beforeEach` → `beforeEnter` → `beforeResolve`，无 `afterEach`）→ 按守卫结果放行 / 重定向 / 中止。

```typescript
// src/router/guards.ts —— 全局守卫
import type { Router } from '@meng-xi/uni-router'

/**
 * 注册全局路由守卫
 * @param router - 路由器实例
 */
export function setupRouterGuards(router: Router): void {
	/**
	 * 全局前置守卫：登录鉴权
	 * @param to - 目标路由
	 * @param from - 来源路由
	 * @returns 未登录时重定向到登录页（携带 redirect 回跳参数）；否则放行
	 */
	router.beforeEach((to, from) => {
		if (to.meta.requireAuth && !uni.getStorageSync('token')) {
			// 显式指定 mode: 'relaunch'：H5 刷新后页面栈为空，
			// 用 relaunch 重建栈，保证后续 back() 可用
			return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'relaunch' }
		}
		// 放行
	})
}
```

```typescript
// src/main.ts —— 创建路由器并注册守卫（需在 mount 前完成）
import { setupRouterGuards } from './router/guards'

const router = createRouter({ /* 选项见第 1 节 */ })
setupRouterGuards(router)
```

```vue
<!-- App.vue —— 冷启动恢复入口 -->
<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
	router.isReady().then(() => {
		router
			.guardRoute(undefined, {
				/**
				 * 守卫中止回调：页面已被框架加载，无法真正"阻止进入"，
				 * 重定向到安全页兜底
				 * @param failure - 导航失败对象（含 to / from / code）
				 */
				onAbort: () => router.relaunch('/pages/index/index')
			})
			.catch(() => {
				// 中止时 guardRoute 会 reject（跳转已由 onAbort 处理），
				// 必须捕获以避免 unhandled rejection 报错
			})
	})
})
</script>
```

```vue
<!-- pages/login/login.vue —— 登录成功后回跳原目标页 -->
<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

/**
 * 登录成功处理：写入凭证后按 redirect 参数回跳
 */
async function onLoginSuccess(): Promise<void> {
	uni.setStorageSync('token', 'xxx')
	// 冷启动场景页面栈为空（可能刚经过 relaunch 重定向），
	// 统一用 relaunch 回跳重建栈；redirect 为空时回首页
	const redirect = (route.query.redirect as string) || '/pages/index/index'
	await router.relaunch(redirect)
}
</script>
```

`guardRoute()` 行为要点：

- 不传 `location` 时检查当前路由（即 H5 URL 直达页），也可传入 `RouteLocationRaw` 检查指定目标
- 守卫放行：**不执行任何导航**（页面已由框架加载），resolve 目标路由
- 守卫重定向：按守卫返回的 `mode` 跳转（`push` / `replace` / `relaunch`），未指定时在 `guardRoute` 场景默认 `relaunch`
- 守卫中止：触发 `onAbort` 回调并 reject `NavigationFailure`，`onAbort` 与 `catch` 至少处理其一，否则产生 unhandled rejection
- 普通导航（`push` / `replace` / `relaunch` / `back`）自动经过守卫链，无需也不应再调用 `guardRoute()`

### 分享链接与 params 恢复

params 的实现机制（ParamsPlugin）：导航时 params 数据存入 ParamsManager（内存 Map，`persistent` 时写入本机 storage），URL query 中仅注入关联键 `__params_key=pk_xxx`；目标页读取时先查内存、再查 storage；H5 刷新后靠 URL 中的 `__params_key` 从 storage 重建。

由此得出两条边界：

- **同设备刷新**：`persistent: true` 的 params 可恢复（数据在本机 storage，URL 关联键仍在）
- **跨设备分享链接**：新设备的内存与 storage 均无数据，params 必为 `undefined`，**无法恢复** —— 分享出去的链接里 `__params_key` 只是一个无效关联键，数据本体不随链接传播

恢复方案（按优先级）：

1. 可分享页面的数据一律走 `query`（URL 天然携带，任何设备打开都在），配合 `route.queryInt()` / `queryNumber()` / `queryBool()` 读取
2. 页面用 query 中的标识（如 `id`）在 `onMounted` 重新请求数据，不依赖跳转时传入的对象
3. 禁止把 `params`（即使 `persistent: true`）作为分享链接的数据载体

```typescript
// 分享目标页：数据全部走 query，进入后按 id 拉取详情
// 链接形如 https://host/#/pages/detail/detail?id=123
import { onMounted } from 'vue'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
const id = route.queryInt('id')

onMounted(async () => {
	if (id != null) {
		detail.value = await fetchDetail(id)
	}
})
```

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

`RouterErrorCode` 错误码：

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
7. 禁止依赖 H5 端 `relaunch` 阻止浏览器后退（History API 无法清栈，详见第 10 节）
8. 禁止假设返回操作总能被拦截 —— 小程序原生返回不可拦截，iOS 侧滑默认绕过守卫
9. 禁止在 H5 端手动调用 `history.back()` / `history.forward()` / `history.go()` / `history.pushState()` 操作历史栈 —— 与库的返回守卫冲突（详见第 10 节）

## 13. 组合式 API 与组件速查

- `useRouter()` / `useRoute()` —— 组件内获取路由器与当前路由
- `router.resolve(location)` —— 仅解析路由位置不导航；`getRoutes()` / `hasRoute(name)` —— 查询路由配置
- `onBeforeRouteLeave((to, from) => ...)` —— 组件内离开守卫
- `useLink(to)` —— `RouterLink` 的逻辑复用
- `usePageChannel()` —— 内置页面通信管理器（需 `useUniEventChannel: true`）
- `<RouterLink :to="{ name: 'about' }">关于</RouterLink>` —— 声明式导航，H5 端渲染原生 `<a>`
- `<TabBar>` / `<TabBarItem>` —— 自定义底部导航（徽标、小红点、安全区、`before-change` 切换前拦截）
