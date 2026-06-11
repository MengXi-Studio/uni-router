# @meng-xi/uni-router 优化点分析

基于 uni-app 全平台兼容性（H5、微信/支付宝/百度/字节/QQ 小程序、App）对 `packages/core` 库进行审查，梳理出以下优化点。

优先级说明：

- **P0**：功能缺陷，影响正确性
- **P1**：uni-app 功能缺失，影响开发体验
- **P2**：健壮性与 API 设计问题
- **P3**：性能优化和代码质量
- **P4**：非 uni-app 原生支持的能力，需额外适配或暂不考虑

---

## 一、uni-app 功能缺失

### 1. 缺少 `reLaunch` 导航方式

uni-app 提供 `uni.reLaunch` 用于关闭所有页面并打开某页面，常用于：

- 退出登录后跳转登录页
- 从深层页面返回首页
- 重置整个页面栈

当前 `Router` 接口仅支持 `push`/`replace`/`back`，缺少 `reLaunch` 对应方法。

**建议**: 新增 `router.relaunch(location: RouteLocationRaw): Promise<RouteLocation>`，对应 `uni.reLaunch`。

### 2. 缺少页面间通信能力（EventChannel）

uni-app 的 `uni.navigateTo` 支持 `events` 和 `success` 回调中的 `EventChannel`，用于页面间双向通信。当前路由器的 `push` 方法仅返回 `Promise<RouteLocation>`，未暴露 `EventChannel`。

**影响**: 无法通过路由器实现页面间通信，开发者仍需回退到原生 `uni.navigateTo`。

**建议**: 扩展 `push` 方法的返回值或参数，支持 EventChannel：

```ts
// 方案一：push 返回包含 EventChannel 的对象
push(location): Promise<{ route: RouteLocation; eventChannel: EventChannel }>

// 方案二：push 接受 events 参数
push(location, { events }): Promise<RouteLocation>
```

---

## 二、健壮性与 API 设计

### 3. `back()` 返回值未携带目标路由信息

**文件**: `src/router/index.ts` L269

`back()` 返回 `Promise<void>`，而 `push`/`replace` 返回 `Promise<RouteLocation>`。调用者无法从 `back()` 的返回值中获取返回到的目标页面信息。

**建议**: 将 `back()` 返回类型改为 `Promise<RouteLocation>`，返回同步后的当前路由。

### 4. 缺少 `isReady` 的超时保护

**文件**: `src/state/index.ts` L99-105

`onReady()` 返回的 Promise 在路由器未初始化时永远不会 resolve。如果 `initRoute()` 因异常未执行，所有 `await router.isReady()` 将永久挂起。

**建议**: 增加超时机制或在 `initRoute` 异常时 reject 所有等待中的 Promise。

---

## 三、性能优化与代码质量

### 5. `isSameQuery` 缺少空对象快速路径

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

### 6. `setCurrentRoute` 每次 `Object.freeze` 的开销

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

### 7. `NavigationFailure.cause` 类型为 `unknown` 过于宽泛

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

### 8. `syncCurrentRoute` 的 `_from` 参数未使用

**文件**: `src/router/index.ts` L463

`syncCurrentRoute(_from: RouteLocation)` 接收 `from` 参数但未使用。`back()` 调用时传入的 `from` 值被浪费。如果需要基于 `from` 做判断（如区分 back 和 push 的同步），当前设计无法支持。

### 9. 缺少开发模式专用警告

以下场景应在 `__DEV__` 模式下输出警告：

- `back()` 在页面栈只有 1 页时调用
- 守卫中同时使用 `async/await` 和 `next()` 回调（容易导致双重解析）
- `syncRoute()` 在 `onHide` 而非 `onShow` 中调用
- `push` 到 TabBar 页面时携带了 query 参数（`uni.switchTab` 不支持 query）

### 10. 缺少导航调试模式

建议增加 `RouterOptions.debug` 选项，开启后输出完整的导航流程日志（守卫执行、API 调用、状态变更），方便小程序开发者工具中排查导航问题。

---

## 四、非 uni-app 原生支持的能力（暂不考虑）

以下功能在 uni-app 中无原生对应或需大量额外适配，建议放在最后考虑：

### 11. `params` 页面传参（非 URL 暴露）

vue-router 的 `params` 通过 URL 路径段传递。uni-app 没有动态路由匹配，但可通过 `EventChannel` 或页面实例的 `$page` 传递不暴露在 URL 中的参数。

**不优先的原因**: 需要深度适配各平台的页面通信机制，且 `EventChannel` 仅 `navigateTo` 支持，`redirectTo`/`switchTab`/`reLaunch` 不支持。建议作为独立功能后续迭代。

### 12. 导航取消机制（AbortController 风格）

当前导航一旦开始无法从外部取消。`AbortController` 风格的取消机制在 uni-app 中没有原生支持，需要自行实现超时和状态管理。

**不优先的原因**: uni-app 的导航 API 本身不支持取消（`uni.navigateTo` 无 abort 能力），实现取消仅能阻止守卫链继续执行，无法真正取消已发出的原生 API 调用。实际收益有限。

### 13. `UniRouter` 类职责拆分

`UniRouter` 类（523 行）承担了导航执行、守卫协调、状态同步、拦截器管理、Vue 插件安装等职责。

**不优先的原因**: 拆分属于架构优化，不影响功能和兼容性。当前规模尚可维护，待功能稳定后再重构。

---

## 优先级排序

| 优先级 | 编号 | 优化点                               | 类型       |
| ------ | ---- | ------------------------------------ | ---------- |
| P1     | 1    | 缺少 `reLaunch` 导航方式             | 功能缺失   |
| P1     | 2    | 缺少 EventChannel 页面通信           | 功能缺失   |
| P2     | 3    | `back()` 返回值未携带路由信息        | API 设计   |
| P2     | 4    | `isReady` 缺少超时保护               | 健壮性     |
| P3     | 5    | `isSameQuery` 空对象快速路径         | 性能       |
| P3     | 6    | `Object.freeze` 生产模式优化         | 性能       |
| P3     | 7    | `NavigationFailure.cause` 类型宽泛   | 类型安全   |
| P3     | 8    | `syncCurrentRoute` 的 `_from` 未使用 | 代码质量   |
| P3     | 9    | 开发模式专用警告                     | 调试       |
| P3     | 10   | 导航调试模式                         | 调试       |
| P4     | 11   | `params` 页面传参                    | 需额外适配 |
| P4     | 12   | 导航取消机制                         | 需额外适配 |
| P4     | 13   | `UniRouter` 类职责拆分               | 架构优化   |
