# uni-router Core 优化清单

> 基于 `packages/core` 源码的全面审查，按优先级分类，每项包含问题描述、影响范围和推荐修复方案。
>
> **uni-app 上下文说明**：本库专为 uni-app 设计，优化建议均基于以下 uni-app 特性评估：
>
> - 页面在 `pages.json` 中静态声明，编译时注册，运行时无法动态增删页面
> - 应用只有一个 Vue 实例，不存在多路由器场景
> - `uni.navigateTo` 等 API 使用 URL 字符串传参，接收端 `page.options` 为简单键值对
> - 物理返回键和浏览器后退直接触发原生 `navigateBack`，不经过路由器

---

## P0 - 严重问题

### 1. `useRoute()` 返回值非响应式

- **文件**: `src/composables/index.ts#L50`
- **问题**: `useRoute()` 直接返回 `router.currentRoute`，这是一个普通对象的快照，不具备 Vue 响应性。当路由变化时，使用 `useRoute()` 的组件不会自动重新渲染。
- **影响**: 所有依赖 `useRoute()` 获取路由信息的组件都无法自动响应路由变化，这是核心 API 的功能缺陷。
- **修复方案**:

```ts
// src/composables/index.ts
import { ref, readonly, type Ref } from 'vue'
import type { Router, RouteLocation } from '@/types'
import { RouterErrorCode } from '@/types/error'
import { RouterError } from '@/errors'
import { ROUTER_SYMBOL } from '@/router'

// 模块级缓存，确保同一 router 实例共享同一个响应式 ref
const reactiveRouteMap = new WeakMap<Router, Ref<RouteLocation>>()

function getReactiveRoute(router: Router): Ref<RouteLocation> {
	let routeRef = reactiveRouteMap.get(router)
	if (routeRef) return routeRef

	routeRef = ref(router.currentRoute) as Ref<RouteLocation>
	reactiveRouteMap.set(router, routeRef)

	// 监听路由变化，自动更新 ref
	router.onRouteChange?.(to => {
		routeRef!.value = to
	})

	return routeRef
}

export function useRoute(): Ref<RouteLocation> {
	const router = useRouter()
	return getReactiveRoute(router)
}
```

> 前置条件：需先完成第 4 项（暴露 `onRouteChange`）。

---

### 2. `back()` 方法绕过导航守卫

- **文件**: `src/router/index.ts#L107-L113`
- **问题**: `back()` 直接调用 `goBack()` 并同步状态，完全跳过了 `beforeEach` / `beforeResolve` 等守卫链。而 `push()` 和 `replace()` 都会执行完整的守卫流程，行为不一致。
- **影响**: 用户通过 `router.back()` 返回时，`beforeEach` 守卫不会执行，可能导致未授权页面被访问（如 `requireAuth` 检查被绕过）。
- **uni-app 限制**: 物理返回键和浏览器后退直接触发原生 `navigateBack`，不经过路由器，因此守卫只能拦截编程式 `router.back()` 调用。对于原生返回，仍需依赖 `syncRoute()` + `afterEach` 做事后处理。此限制应在文档中明确说明。
- **修复方案**:

```ts
// src/router/index.ts - 修改 back() 方法
async back(delta: number = 1): Promise<void> {
	const from = this.routeState.getCurrentRoute()

	// 计算目标页面
	const pages = getCurrentPages()
	const targetIndex = pages.length - 1 - delta
	if (targetIndex < 0) {
		warn('Cannot go back: no previous page in the navigation stack')
		return
	}

	const targetPage = pages[targetIndex]
	const targetPath = `/${targetPage.route}`
	const to = this.matcher.resolve(targetPath)

	// 执行守卫链（仅拦截编程式调用，物理返回键不经过此处）
	const beforeResult = await this.guardManager.runBeforeGuards(to, from)
	const handled = this.handleGuardResult(beforeResult, to, from, 'push', 0)
	if (handled) {
		// 守卫中止或重定向
		return handled as unknown as void
	}

	const beforeResolveResult = await this.guardManager.runBeforeResolveGuards(to, from)
	const handledResolve = this.handleGuardResult(beforeResolveResult, to, from, 'push', 0)
	if (handledResolve) {
		return handledResolve as unknown as void
	}

	await goBack(delta)
	this.syncCurrentRoute(from)
}
```

---

### 3. 守卫未调用 `next()` 导致导航永久挂起

- **文件**: `src/guard/index.ts#L70-L100`
- **问题**: 如果守卫函数既不调用 `next()` 也不返回 rejected Promise（例如忘记调用 `next`），`runGuard` 返回的 Promise 将永远不会 resolve，导致整个导航链挂起，无任何错误提示。
- **影响**: 开发者容易犯此错误，且难以排查（无报错、无超时）。
- **修复方案**: 添加超时机制和开发模式警告。

```ts
// src/guard/index.ts - 修改 runGuard 函数
const GUARD_TIMEOUT = 10000 // 10 秒超时

function runGuard(guard: NavigationGuard, to: RouteLocation, from: RouteLocation): Promise<GuardResult> {
	return new Promise(resolve => {
		let resolved = false
		let timer: ReturnType<typeof setTimeout> | undefined

		const next: NavigationGuardNext = (location?: RouteLocationRaw | false) => {
			if (resolved) return
			resolved = true
			if (timer) clearTimeout(timer)

			if (location === false) {
				resolve({ type: 'abort', code: RouterErrorCode.NAVIGATION_ABORTED })
			} else if (location) {
				resolve({ type: 'next', redirect: location })
			} else {
				resolve({ type: 'next' })
			}
		}

		// 开发环境超时警告
		timer = setTimeout(() => {
			if (!resolved) {
				warn(`Navigation guard "${guard.name || 'anonymous'}" did not resolve within ${GUARD_TIMEOUT / 1000}s. ` + 'Make sure to call next() in your guard function.')
			}
		}, GUARD_TIMEOUT)

		// ... 其余逻辑不变
	})
}
```

---

### 4. 拦截器 `_isRouterCall` 存在竞态条件

- **文件**: `src/interceptor/index.ts#L18-L22`
- **问题**: `_isRouterCall` 是模块级布尔变量。在并发导航场景下（如快速连续点击），路由器调用 `markRouterCall()` 设置标记后，如果另一个拦截器 invoke 在 `_isRouterCall` 被消费前触发，标记会被错误消费。
- **影响**: 并发导航时，外部调用可能被误放行，或路由器内部调用被误拦截。
- **修复方案**: 使用计数器替代布尔值。

```ts
// src/interceptor/index.ts
let _routerCallCount = 0

export function markRouterCall(): void {
	_routerCallCount++
}

// 在 invoke 回调中
invoke(args: Record<string, any>) {
	if (_routerCallCount > 0) {
		_routerCallCount--
		return args
	}
	return handleInterceptedNavigation(api, args)
}
```

---

## P1 - 重要优化

### 5. `onRouteChange` 未通过 Router 接口暴露

- **文件**: `src/state/index.ts#L107-L113`, `src/types/router.ts`
- **问题**: `createRouteState()` 提供了 `onRouteChange()` 方法，但 `Router` 接口和 `UniRouter` 类均未暴露此方法。外部无法订阅路由变化，也导致第 1 项（响应式 useRoute）无法实现。
- **影响**: 用户无法编程式监听路由变化，只能依赖 `afterEach` 守卫（语义不同）。
- **修复方案**:

```ts
// src/types/router.ts - 在 Router 接口中添加
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void

// src/router/index.ts - 在 UniRouter 类中添加
onRouteChange(listener: (to: RouteLocation, from: RouteLocation) => void): () => void {
	return this.routeState.onRouteChange(listener)
}
```

---

### 6. `syncCurrentRoute` 触发 `afterEach` 钩子可能引发副作用

- **文件**: `src/router/index.ts#L438-L447`
- **问题**: `syncCurrentRoute()` 在状态同步时调用 `runAfterGuards(to, from)`。但状态同步不是一次完整的导航（没有经过前置守卫），触发 `afterEach` 可能让用户误以为发生了一次完整导航。
- **影响**: `afterEach` 中如果包含依赖完整导航流程的逻辑（如页面访问统计、动画触发），可能产生错误行为。
- **修复方案**: 区分"导航完成"和"状态同步"，添加导航来源标记。

```ts
// src/types/route.ts - RouteLocation 添加可选标记
export interface RouteLocation {
	// ... 现有字段
	/** 是否为状态同步（非完整导航） */
	_synced?: boolean
}

// src/router/index.ts - syncCurrentRoute 不触发 afterEach
private syncCurrentRoute(from: RouteLocation): void {
	const currentPath = getCurrentPagePath()
	const config = this.matcher.getRouteConfig(currentPath)
	const meta: RouteMeta = config?.meta ?? {}
	const query = getCurrentPageQuery()
	const fullPath = buildFullPath(currentPath, query)
	const to: RouteLocation = { path: currentPath, meta, query, fullPath, _synced: true }
	this.routeState.setCurrentRoute(to)
	// 仅通知路由变化监听器，不触发 afterEach
}
```

---

### 7. `performNavigation` 静默吞掉前一次导航的错误

- **文件**: `src/router/index.ts#L158-L159`
- **问题**: `await this.pendingNavigation.catch(() => {})` 静默吞掉了前一次导航的错误。虽然这是为了等待前一次导航完成，但丢失了错误信息。
- **影响**: 错误已被 `onError` 处理，但调用者如果依赖 `performNavigation` 的返回值，可能无法感知前一次导航失败。
- **修复方案**: 当前行为在语义上是合理的（等待完成即可，不需要关心结果），但建议添加注释说明设计意图。

```ts
// 等待前一次导航完成（无论成功或失败），避免并发导航
// 错误已通过 onError 机制通知，此处无需再处理
if (this.pendingNavigation) {
	await this.pendingNavigation.catch(() => {})
}
```

---

## P2 - 改进建议

### 8. `buildFullPath` 查询参数顺序不确定

- **文件**: `src/utils/path.ts#L8-L13`
- **问题**: `Object.keys(query)` 的遍历顺序取决于引擎实现（虽然 ES2015+ 保证整数键有序），不同环境下同一 query 对象可能生成不同的 fullPath 字符串。
- **影响**: `isSameRouteLocation` 依赖 fullPath 的字符串比较时可能产生误判；缓存 key 不稳定。
- **修复方案**: 对键排序。

```ts
export function buildFullPath(path: string, query: Record<string, string>): string {
	const keys = Object.keys(query)
	if (keys.length === 0) return path

	keys.sort() // 确保确定性
	const qs = keys.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')
	return `${path}?${qs}`
}
```

---

### 9. `isSameRouteLocation` 未考虑 `name` 字段

- **文件**: `src/router/index.ts#L393-L399`
- **问题**: 重复导航检测仅比较 `path` 和 `query`，不考虑 `name`。如果两个命名路由指向同一路径但 name 不同（虽然当前实现中 path 唯一），会被误判为重复。
- **影响**: 当前 pathMap 保证路径唯一，实际影响较小，但逻辑不够严谨。
- **修复方案**:

```ts
private isSameRouteLocation(a: RouteLocation, b: RouteLocation): boolean {
	if (a.path !== b.path) return false
	if (a.name !== b.name) return false
	return this.isSameQuery(a.query, b.query)
}
```

---

### 10. `goBack` 页面栈不足时静默 resolve

- **文件**: `src/navigation/navigate.ts#L129-L133`
- **问题**: 当页面栈不足以执行返回操作时，`goBack()` 仅输出警告并 resolve，调用者无法区分"成功返回"和"未执行"。
- **影响**: 调用者可能误以为返回操作已执行。
- **修复方案**: 返回布尔值或抛出可捕获的错误。

```ts
export function goBack(delta: number = 1): Promise<boolean> {
	const pages = getCurrentPages()
	if (pages.length <= delta) {
		warn('Cannot go back: no previous page in the navigation stack')
		return Promise.resolve(false)
	}
	return uniNavigateBack(delta).then(() => true)
}
```

---

### 11. 拦截器模块级状态限制单实例

- **文件**: `src/interceptor/index.ts#L18-L19`
- **问题**: `_isRouterCall` 和 `_router` 是模块级变量，全局只能有一个路由器实例使用拦截器。
- **uni-app 上下文**: uni-app 应用只有一个 Vue 实例，实际不会出现多路由器场景，因此当前实现在 uni-app 中不会产生问题。此项作为可扩展性备忘保留，优先级低。

---

### 12. `RouterLink.vue` 导航错误未处理

- **文件**: `components/RouterLink.vue#L37-L43`
- **问题**: `navigate()` 函数调用 `router.push/replace` 但未处理可能抛出的 `NavigationFailure`（如守卫中止、重复导航），会导致 Unhandled Promise Rejection。
- **影响**: 控制台出现未捕获的 Promise 异常警告。
- **修复方案**:

```ts
async function navigate() {
	try {
		if (props.replace) {
			await router.replace(props.to)
		} else {
			await router.push(props.to)
		}
	} catch {
		// 导航被守卫中止或重复导航，静默处理
	}
}
```

---

### 13. `install` 方法类型断言过于宽松

- **文件**: `src/router/index.ts#L267-L272`
- **问题**: `install(app: unknown)` 接受 `unknown` 参数，然后通过 `as` 断言为自定义类型。这绕过了 TypeScript 的类型检查，如果 Vue 应用实例结构变化会导致运行时错误。
- **影响**: 类型安全性降低。
- **修复方案**: 使用 Vue 的 `App` 类型。

```ts
import type { App } from 'vue'

install(app: App): void {
	// 直接使用 app.provide / app.config.globalProperties
	// 无需类型断言
}
```

---

## 优化汇总

| 编号 | 优先级 | 模块         | 概要                            | 类型     | uni-app 备注                                 |
| ---- | ------ | ------------ | ------------------------------- | -------- | -------------------------------------------- |
| 1    | P0     | composables  | useRoute 非响应式               | 功能缺陷 | -                                            |
| 2    | P0     | router       | back() 绕过守卫                 | 功能缺陷 | 守卫仅拦截编程式调用，物理返回键不经过路由器 |
| 3    | P0     | guard        | 守卫未调用 next 导致挂起        | 功能缺陷 | -                                            |
| 4    | P0     | interceptor  | \_isRouterCall 竞态条件         | 并发安全 | -                                            |
| 5    | P1     | router/types | onRouteChange 未暴露            | API 缺失 | -                                            |
| 6    | P1     | router       | syncCurrentRoute 误触 afterEach | 语义错误 | -                                            |
| 7    | P1     | router       | 静默吞掉导航错误                | 可维护性 | -                                            |
| 8    | P2     | utils        | fullPath 参数顺序不确定         | 确定性   | -                                            |
| 9    | P2     | router       | 重复导航检测未考虑 name         | 严谨性   | -                                            |
| 10   | P2     | navigation   | goBack 静默成功                 | 可观测性 | -                                            |
| 11   | P2     | interceptor  | 模块级状态限制单实例            | 可扩展性 | uni-app 单实例，实际不影响                   |
| 12   | P2     | RouterLink   | 导航错误未捕获                  | 健壮性   | -                                            |
| 13   | P2     | router       | install 类型断言宽松            | 类型安全 | -                                            |

---

## 建议实施顺序

1. **第一批（P0）**: #4 → #3 → #2 → #5 → #1（#1 依赖 #5）
2. **第二批（P1）**: #6 → #7
3. **第三批（P2）**: #8 → #9 → #10 → #11 → #12 → #13
