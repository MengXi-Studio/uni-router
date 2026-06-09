# @meng-xi/uni-router 优化点分析

基于 uni-app 全平台兼容性（H5、微信/支付宝/百度/字节/QQ 小程序、App）对 `packages/core` 库进行审查，梳理出以下优化点。

优先级说明：

- **P0**：功能缺陷，影响正确性
- **P1**：uni-app 全平台兼容性问题，影响部分平台或场景的可用性
- **P2**：uni-app 功能缺失，影响开发体验
- **P3**：性能优化和代码质量
- **P4**：非 uni-app 原生支持的能力，需额外适配或暂不考虑

---

## 一、功能缺陷（Bug）

### 1. `back()` 成功返回后未触发 `afterEach`

**文件**: `src/router/index.ts` L305-310

`push`/`replace` 在 `executeNavigation` 中导航成功后调用了 `runAfterGuards`，但 `back()` 在守卫通过并成功返回后缺少此调用。

```ts
// 当前代码
await goBack(delta)
this.syncCurrentRoute(from)

// 应改为
await goBack(delta)
this.syncCurrentRoute(from)
this.guardManager.runAfterGuards(to, from)
```

**影响**: 依赖 `afterEach` 做页面统计、标题设置、埋点等逻辑在 `back()` 场景下完全失效。

### 2. `syncRoute()` 仅比较 path 忽略 query 差异

**文件**: `src/router/index.ts` L396-400

```ts
syncRoute(): void {
    const from = this.routeState.getCurrentRoute()
    const currentPath = getCurrentPagePath()
    if (currentPath === from.path) return  // 仅比较 path
    this.syncCurrentRoute(from)
}
```

uni-app 中同一页面路径可以携带不同 query 参数（如商品详情页 `/pages/detail/detail?id=1` 和 `?id=2`）。物理返回到同路径不同 query 的页面时，路由状态不会更新。

**建议**: 同时比较 path 和 query：

```ts
const currentQuery = getCurrentPageQuery()
if (currentPath === from.path && this.isSameQuery(currentQuery, from.query)) return
```

### 3. `goBack()` 返回值逻辑与 `back()` 重复且不一致

**文件**: `src/navigation/navigate.ts` L140-146

`goBack()` 在页面栈不足时返回 `Promise.resolve(false)`，但 `back()` 已提前做了栈检查并 reject。`goBack` 的 `false` 返回值永远不会被使用，两处逻辑重复。

**建议**: `goBack()` 栈不足时也应 reject，与 `back()` 保持一致；或移除 `goBack` 中的栈检查，完全由 `back()` 负责。

### 4. `back()` 守卫重定向时传入错误的 mode

**文件**: `src/router/index.ts` L296, L300

`back()` 调用 `handleGuardResult` 时传入 `mode: 'push'`。当守卫触发重定向时，会以 `push` 模式执行。虽然重定向本身语义上是 push（打开新页面），但传入错误 mode 降低代码可读性，且未来扩展时可能引发问题。

---

## 二、uni-app 全平台兼容性

### 5. `getCurrentPages()` 调用缺乏环境保护

**文件**: `src/navigation/context.ts`

`getCurrentPages()` 是 uni-app 运行时 API，在 SSR、Node 测试环境、构建工具静态分析阶段不存在。当前代码直接调用无任何保护，会抛出 `ReferenceError`。

**影响**: 使用 Vite SSR 或在 Node 环境中导入库时崩溃。

**建议**:

```ts
export function getPageStackLength(): number {
	if (typeof getCurrentPages !== 'function') return 0
	return getCurrentPages().length
}
```

### 6. `install` 中 `app.onUnmount` 是 uni-app 扩展 API

**文件**: `src/router/index.ts` L434

`app.onUnmount` 是 uni-app 对 Vue `App` 的扩展，标准 Vue 3 中不存在。虽然本库面向 uni-app，但应做防御性检查，避免在 H5 端某些 Vue 版本下报错。

**建议**:

```ts
if (this._interceptUniApi && typeof app.onUnmount === 'function') {
	app.onUnmount(() => removeInterceptors())
}
```

### 7. 拦截器 `invoke` 返回值在低版本小程序基础库可能不生效

**文件**: `src/interceptor/index.ts` L147

uni-app `addInterceptor` 的 `invoke` 回调中，返回 `args` 放行、返回 `false` 阻止。但部分低版本小程序基础库可能忽略返回值而继续执行原始 API。

**影响**: 低版本微信/支付宝小程序上，`interceptUniApi` 功能可能失效，守卫被绕过。

**建议**: 阻止时同时修改 `args.url` 为空字符串作为双重保险：

```ts
invoke(args: Record<string, any>) {
    if (activeManager?.isRouterCall()) {
        return args
    }
    // 双重保险：修改 URL 防止低版本基础库忽略返回值
    if ('url' in args) args.url = ''
    return handleInterceptedNavigation(api, args)
}
```

### 8. 拦截器模块级单例不支持多路由器实例

**文件**: `src/interceptor/index.ts`

`activeManager` 是模块级变量，全局唯一。如果应用中创建多个 Router 实例且都启用 `interceptUniApi`，后创建的实例会覆盖前一个的拦截器引用。

**建议**: 在文档中明确说明只支持单路由器实例（uni-app 本身也是单应用模型，此问题实际影响较小），或在 `installInterceptors` 中检测并警告重复安装。

### 9. `uni.navigateTo` 动画参数未透传

**文件**: `src/navigation/navigate.ts`

uni-app 的 `uni.navigateTo` 支持 `animationType` / `animationDuration` 参数控制页面切换动画（仅 App 端生效）。当前 `navigateTo` 函数仅传递 `url`，未支持动画参数。

**影响**: App 端无法通过路由器控制页面切换动画。

**建议**: 在 `RouteLocationPathRaw` / `RouteLocationNamedRaw` 中增加可选的 `animation` 字段：

```ts
interface RouteLocationPathRaw {
	path: RoutePath
	query?: Record<string, string>
	animation?: { type: UniAnimationType; duration: number }
}
```

### 10. `uni.preloadPage` 分包预加载未支持

uni-app 提供 `uni.preloadPage` 用于预加载分包页面，在路由导航前预加载可显著提升分包页面的打开速度。当前路由器未集成此能力。

**建议**: 在 `RouterOptions` 中增加 `preloadSubPackages` 选项，或在 `push` 时自动检测分包页面并预加载。

---

## 三、uni-app 功能缺失

### 12. 缺少 `reLaunch` 导航方式

uni-app 提供 `uni.reLaunch` 用于关闭所有页面并打开某页面，常用于：

- 退出登录后跳转登录页
- 从深层页面返回首页
- 重置整个页面栈

当前 `Router` 接口仅支持 `push`/`replace`/`back`，缺少 `reLaunch` 对应方法。

**建议**: 新增 `router.relaunch(location: RouteLocationRaw): Promise<RouteLocation>`，对应 `uni.reLaunch`。

### 13. 缺少页面间通信能力（EventChannel）

uni-app 的 `uni.navigateTo` 支持 `events` 和 `success` 回调中的 `EventChannel`，用于页面间双向通信。当前路由器的 `push` 方法仅返回 `Promise<RouteLocation>`，未暴露 `EventChannel`。

**影响**: 无法通过路由器实现页面间通信，开发者仍需回退到原生 `uni.navigateTo`。

**建议**: 扩展 `push` 方法的返回值或参数，支持 EventChannel：

```ts
// 方案一：push 返回包含 EventChannel 的对象
push(location): Promise<{ route: RouteLocation; eventChannel: EventChannel }>

// 方案二：push 接受 events 参数
push(location, { events }): Promise<RouteLocation>
```

### 14. `back()` 返回值未携带目标路由信息

**文件**: `src/router/index.ts` L269

`back()` 返回 `Promise<void>`，而 `push`/`replace` 返回 `Promise<RouteLocation>`。调用者无法从 `back()` 的返回值中获取返回到的目标页面信息。

**建议**: 将 `back()` 返回类型改为 `Promise<RouteLocation>`，返回同步后的当前路由。

### 15. 缺少 `isReady` 的超时保护

**文件**: `src/state/index.ts` L99-105

`onReady()` 返回的 Promise 在路由器未初始化时永远不会 resolve。如果 `initRoute()` 因异常未执行，所有 `await router.isReady()` 将永久挂起。

**建议**: 增加超时机制或在 `initRoute` 异常时 reject 所有等待中的 Promise。

---

## 四、性能优化与代码质量

### 16. `isSameQuery` 缺少空对象快速路径

**文件**: `src/router/index.ts` L440-446

每次 `push` 都会执行 `isSameRouteLocation` 检测，而大多数场景下 query 为空对象 `{}`。

```ts
private isSameQuery(a: Record<string, string>, b: Record<string, string>): boolean {
    if (a === b) return true
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length === 0 && keysB.length === 0) return true
    if (keysA.length !== keysB.length) return false
    return keysA.every(key => a[key] === b[key])
}
```

### 17. `setCurrentRoute` 每次 `Object.freeze` 的开销

**文件**: `src/state/index.ts` L59-63

每次路由变化都执行两次 `Object.freeze` + 两次对象展开。小程序平台对性能更敏感，建议生产模式下跳过冻结：

```ts
function setCurrentRoute(route: RouteLocation): void {
	const from = currentRoute
	if (__DEV__) {
		currentRoute = Object.freeze({
			...route,
			meta: Object.freeze({ ...route.meta }),
			query: Object.freeze({ ...route.query })
		})
	} else {
		currentRoute = { ...route, meta: { ...route.meta }, query: { ...route.query } }
	}
	// ...
}
```

### 18. `NavigationFailure.cause` 类型为 `unknown` 过于宽泛

**文件**: `src/types/error.ts` L20

uni-app API 失败时 `cause` 的结构是确定的（`{ errMsg: string }`），可提供更具体的类型：

```ts
interface UniApiCause {
	errMsg: string
}

interface NavigationFailure extends RouterError {
	readonly cause?: UniApiCause
}
```

### 19. `syncCurrentRoute` 的 `_from` 参数未使用

**文件**: `src/router/index.ts` L463

`syncCurrentRoute(_from: RouteLocation)` 接收 `from` 参数但未使用。`back()` 调用时传入的 `from` 值被浪费。如果需要基于 `from` 做判断（如区分 back 和 push 的同步），当前设计无法支持。

### 20. 缺少开发模式专用警告

以下场景应在 `__DEV__` 模式下输出警告：

- `back()` 在页面栈只有 1 页时调用
- 守卫中同时使用 `async/await` 和 `next()` 回调（容易导致双重解析）
- `syncRoute()` 在 `onHide` 而非 `onShow` 中调用
- `push` 到 TabBar 页面时携带了 query 参数（`uni.switchTab` 不支持 query）

### 21. 缺少导航调试模式

建议增加 `RouterOptions.debug` 选项，开启后输出完整的导航流程日志（守卫执行、API 调用、状态变更），方便小程序开发者工具中排查导航问题。

---

## 五、非 uni-app 原生支持的能力（暂不考虑）

以下功能在 uni-app 中无原生对应或需大量额外适配，建议放在最后考虑：

### 22. `params` 页面传参（非 URL 暴露）

vue-router 的 `params` 通过 URL 路径段传递。uni-app 没有动态路由匹配，但可通过 `EventChannel` 或页面实例的 `$page` 传递不暴露在 URL 中的参数。

**不优先的原因**: 需要深度适配各平台的页面通信机制，且 `EventChannel` 仅 `navigateTo` 支持，`redirectTo`/`switchTab`/`reLaunch` 不支持。建议作为独立功能后续迭代。

### 23. 导航取消机制（AbortController 风格）

当前导航一旦开始无法从外部取消。`AbortController` 风格的取消机制在 uni-app 中没有原生支持，需要自行实现超时和状态管理。

**不优先的原因**: uni-app 的导航 API 本身不支持取消（`uni.navigateTo` 无 abort 能力），实现取消仅能阻止守卫链继续执行，无法真正取消已发出的原生 API 调用。实际收益有限。

### 24. `forward` 方法

vue-router 提供 `router.forward()`，但 uni-app 没有任何"前进"API（`getCurrentPages()` 只能获取当前栈，无法获取已弹出的页面信息）。

**不优先的原因**: uni-app 无原生支持，无法实现有意义的 forward 功能。

### 25. `UniRouter` 类职责拆分

`UniRouter` 类（523 行）承担了导航执行、守卫协调、状态同步、拦截器管理、Vue 插件安装等职责。

**不优先的原因**: 拆分属于架构优化，不影响功能和兼容性。当前规模尚可维护，待功能稳定后再重构。

---

## 优先级排序

| 优先级 | 编号 | 优化点                               | 类型       |
| ------ | ---- | ------------------------------------ | ---------- |
| P0     | 1    | `back()` 缺少 `afterEach` 调用       | Bug        |
| P0     | 2    | `syncRoute()` 忽略 query 差异        | Bug        |
| P1     | 5    | `getCurrentPages()` 缺乏环境保护     | 兼容性     |
| P1     | 7    | 拦截器 `invoke` 低版本基础库兼容     | 兼容性     |
| P1     | 12   | 缺少 `reLaunch` 导航方式             | 功能缺失   |
| P1     | 13   | 缺少 EventChannel 页面通信           | 功能缺失   |
| P2     | 6    | `app.onUnmount` 防御性检查           | 兼容性     |
| P2     | 8    | 拦截器模块级单例                     | 兼容性     |
| P2     | 9    | `navigateTo` 动画参数未透传          | 功能缺失   |
| P2     | 10   | 分包预加载未支持                     | 功能缺失   |
| P2     | 14   | `back()` 返回值未携带路由信息        | API 设计   |
| P2     | 15   | `isReady` 缺少超时保护               | 健壮性     |
| P3     | 3    | `goBack` 返回值逻辑不一致            | 代码质量   |
| P3     | 4    | `back()` 守卫重定向 mode 错误        | 代码质量   |
| P3     | 16   | `isSameQuery` 空对象快速路径         | 性能       |
| P3     | 17   | `Object.freeze` 生产模式优化         | 性能       |
| P3     | 18   | `NavigationFailure.cause` 类型宽泛   | 类型安全   |
| P3     | 19   | `syncCurrentRoute` 的 `_from` 未使用 | 代码质量   |
| P3     | 20   | 开发模式专用警告                     | 调试       |
| P3     | 21   | 导航调试模式                         | 调试       |
| P4     | 22   | `params` 页面传参                    | 需额外适配 |
| P4     | 23   | 导航取消机制                         | 需额外适配 |
| P4     | 24   | `forward` 方法                       | 无原生支持 |
| P4     | 25   | `UniRouter` 类职责拆分               | 架构优化   |
