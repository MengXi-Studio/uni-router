# H5 端详解：限制、冷启动恢复与分享链接 params

本文为 SKILL.md 第 10 节的完整展开，编写 H5 路由代码、处理刷新 / 分享链接场景时读取。

## History API 导航映射

H5 端底层使用 History API，导航方法映射：`push` → `history.pushState`（新增历史记录）、`replace` → `history.replaceState`（替换当前记录）、`relaunch` → 多次 `history.replaceState`、`back` → `history.back()`。

## 限制与解决方案（完整表）

| 限制 | 具体表现 | 解决方案 |
| --- | --- | --- |
| 无法真正清空历史栈 | `relaunch` 只能替换当前记录，用户仍可通过浏览器后退回到之前的页面（如退出登录后回到个人中心） | `beforeEach` 中重新鉴权并重定向；关键场景由后端重定向兜底 |
| 刷新后页面栈丢失 | `getCurrentPages()` 只剩当前页，`back()` 栈不足时抛 `NAVIGATION_CANCELLED` | 返回前检查栈深，栈不足时改用 `relaunch` 跳转目标页 |
| 刷新后非持久化 params 丢失 | params 存于内存 Map，刷新后清空 | 单次导航 `persistent: true`，或全局 `paramsPersistent: true` |
| `replace` / `relaunch` 无动画 | H5 动画为 CSS 过渡，仅 `push` / `back` 生效 | 需要动画效果的跳转使用 `push` / `back` |
| 刷新 / 直达 URL 不经过守卫 | 页面由框架直接加载，`beforeEach` 等守卫未执行，存在越权访问风险 | App.vue `onLaunch` 中调用 `router.guardRoute()` 补执行守卫链（见下文示例） |

## 浏览器后退与守卫（H5 特有行为）

- 浏览器后退按钮 / 后退手势通过 `popstate` 事件接入守卫链，`onBeforeBack` 在 H5 端同样生效
- 库的处理流程：popstate 触发后先撤销本次后退（URL 弹回原页面）→ 执行守卫链 → 放行则执行返回、中止则停留在当前页
- 守卫中止返回时浏览器地址栏会短暂变化后复原，属正常现象，不要据此判断导航异常
- 禁止在业务代码中手动调用 `history.back()` / `history.forward()` / `history.go()` 操作历史栈 —— 会与库的返回守卫冲突，破坏守卫语义（库内部已处理程序化返回与浏览器后退并发的 popstate 竞态，v2.7.1 修复了由此引发的返回死循环 / 页面闪烁）

## 冷启动恢复完整示例

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

const router = createRouter({ /* 选项见 SKILL.md 第 1 节 */ })
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

## 分享链接与 params 恢复

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
