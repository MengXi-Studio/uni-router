# @meng-xi/uni-router 优化点分析

基于 uni-app 全平台兼容性（H5、微信/支付宝/百度/字节/QQ 小程序、App）对 `packages/core` 库进行审查，梳理出以下优化点。

优先级说明：

- **P0**：功能缺陷，影响正确性
- **P1**：uni-app 全平台兼容性问题，影响部分平台或场景的可用性
- **P2**：uni-app 功能缺失，影响开发体验
- **P3**：性能优化和代码质量
- **P4**：非 uni-app 原生支持的能力，需额外适配或暂不考虑

---

## 一、uni-app 全平台兼容性

### 1. `getCurrentPages()` 调用缺乏环境保护

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

### 2. `install` 中 `app.onUnmount` 是 uni-app 扩展 API

**文件**: `src/router/index.ts` L434

`app.onUnmount` 是 uni-app 对 Vue `App` 的扩展，标准 Vue 3 中不存在。虽然本库面向 uni-app，但应做防御性检查，避免在 H5 端某些 Vue 版本下报错。

**建议**:

```ts
if (this._interceptUniApi && typeof app.onUnmount === 'function') {
	app.onUnmount(() => removeInterceptors())
}
```

### 3. 拦截器 `invoke` 返回值在低版本小程序基础库可能不生效

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

### 4. 拦截器模块级单例不支持多路由器实例

**文件**: `src/interceptor/index.ts`

`activeManager` 是模块级变量，全局唯一。如果应用中创建多个 Router 实例且都启用 `interceptUniApi`，后创建的实例会覆盖前一个的拦截器引用。

**建议**: 在文档中明确说明只支持单路由器实例（uni-app 本身也是单应用模型，此问题实际影响较小），或在 `installInterceptors` 中检测并警告重复安装。

### 5. `uni.navigateTo` 动画参数未透传

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

### 6. `uni.preloadPage` 分包预加载未支持

uni-app 提供 `uni.preloadPage` 用于预加载分包页面，在路由导航前预加载可显著提升分包页面的打开速度。当前路由器未集成此能力。

**建议**: 在 `RouterOptions` 中增加 `preloadSubPackages` 选项，或在 `push` 时自动检测分包页面并预加载。

---

## 二、uni-app 功能缺失

### 7. 缺少 `reLaunch` 导航方式

uni-app 提供 `uni.reLaunch` 用于关闭所有页面并打开某页面，常用于：

- 退出登录后跳转登录页
- 从深层页面返回首页
- 重置整个页面栈

当前 `Router` 接口仅支持 `push`/`replace`/`back`，缺少 `reLaunch` 对应方法。

**建议**: 新增 `router.relaunch(location: RouteLocationRaw): Promise<RouteLocation>`，对应 `uni.reLaunch`。

### 8. 缺少页面间通信能力（EventChannel）

uni-app 的 `uni.navigateTo` 支持 `events` 和 `success` 回调中的 `EventChannel`，用于页面间双向通信。当前路由器的 `push` 方法仅返回 `Promise<RouteLocation>`，未暴露 `EventChannel`。

**影响**: 无法通过路由器实现页面间通信，开发者仍需回退到原生 `uni.navigateTo`。

**建议**: 扩展 `push` 方法的返回值或参数，支持 EventChannel：

```ts
// 方案一：push 返回包含 EventChannel 的对象
push(location): Promise<{ route: RouteLocation; eventChannel: EventChannel }>

// 方案二：push 接受 events 参数
push(location, { events }): Promise<RouteLocation>
```

### 9. `back()` 返回值未携带目标路由信息

**文件**: `src/router/index.ts` L269

`back()` 返回 `Promise<void>`，而 `push`/`replace` 返回 `Promise<RouteLocation>`。调用者无法从 `back()` 的返回值中获取返回到的目标页面信息。

**建议**: 将 `back()` 返回类型改为 `Promise<RouteLocation>`，返回同步后的当前路由。

### 10. 缺少 `isReady` 的超时保护

**文件**: `src/state/index.ts` L99-105

`onReady()` 返回的 Promise 在路由器未初始化时永远不会 resolve。如果 `initRoute()` 因异常未执行，所有 `await router.isReady()` 将永久挂起。

**建议**: 增加超时机制或在 `initRoute` 异常时 reject 所有等待中的 Promise。

---

## 三、性能优化与代码质量

### 11. `isSameQuery` 缺少空对象快速路径

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

### 12. `setCurrentRoute` 每次 `Object.freeze` 的开销

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

### 13. `NavigationFailure.cause` 类型为 `unknown` 过于宽泛

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

### 14. `syncCurrentRoute` 的 `_from` 参数未使用

**文件**: `src/router/index.ts` L463

`syncCurrentRoute(_from: RouteLocation)` 接收 `from` 参数但未使用。`back()` 调用时传入的 `from` 值被浪费。如果需要基于 `from` 做判断（如区分 back 和 push 的同步），当前设计无法支持。

### 15. 缺少开发模式专用警告

以下场景应在 `__DEV__` 模式下输出警告：

- `back()` 在页面栈只有 1 页时调用
- 守卫中同时使用 `async/await` 和 `next()` 回调（容易导致双重解析）
- `syncRoute()` 在 `onHide` 而非 `onShow` 中调用
- `push` 到 TabBar 页面时携带了 query 参数（`uni.switchTab` 不支持 query）

### 16. 缺少导航调试模式

建议增加 `RouterOptions.debug` 选项，开启后输出完整的导航流程日志（守卫执行、API 调用、状态变更），方便小程序开发者工具中排查导航问题。

---

## 四、非 uni-app 原生支持的能力（暂不考虑）

以下功能在 uni-app 中无原生对应或需大量额外适配，建议放在最后考虑：

### 17. `params` 页面传参（非 URL 暴露）

vue-router 的 `params` 通过 URL 路径段传递。uni-app 没有动态路由匹配，但可通过 `EventChannel` 或页面实例的 `$page` 传递不暴露在 URL 中的参数。

**不优先的原因**: 需要深度适配各平台的页面通信机制，且 `EventChannel` 仅 `navigateTo` 支持，`redirectTo`/`switchTab`/`reLaunch` 不支持。建议作为独立功能后续迭代。

### 18. 导航取消机制（AbortController 风格）

当前导航一旦开始无法从外部取消。`AbortController` 风格的取消机制在 uni-app 中没有原生支持，需要自行实现超时和状态管理。

**不优先的原因**: uni-app 的导航 API 本身不支持取消（`uni.navigateTo` 无 abort 能力），实现取消仅能阻止守卫链继续执行，无法真正取消已发出的原生 API 调用。实际收益有限。

### 19. `UniRouter` 类职责拆分

`UniRouter` 类（523 行）承担了导航执行、守卫协调、状态同步、拦截器管理、Vue 插件安装等职责。

**不优先的原因**: 拆分属于架构优化，不影响功能和兼容性。当前规模尚可维护，待功能稳定后再重构。

---

## 优先级排序

| 优先级 | 编号 | 优化点                               | 类型       |
| ------ | ---- | ------------------------------------ | ---------- |
| P1     | 1    | `getCurrentPages()` 缺乏环境保护     | 兼容性     |
| P1     | 3    | 拦截器 `invoke` 低版本基础库兼容     | 兼容性     |
| P1     | 7    | 缺少 `reLaunch` 导航方式             | 功能缺失   |
| P1     | 8    | 缺少 EventChannel 页面通信           | 功能缺失   |
| P2     | 2    | `app.onUnmount` 防御性检查           | 兼容性     |
| P2     | 4    | 拦截器模块级单例                     | 兼容性     |
| P2     | 5    | `navigateTo` 动画参数未透传          | 功能缺失   |
| P2     | 6    | 分包预加载未支持                     | 功能缺失   |
| P2     | 9    | `back()` 返回值未携带路由信息        | API 设计   |
| P2     | 10   | `isReady` 缺少超时保护               | 健壮性     |
| P3     | 11   | `isSameQuery` 空对象快速路径         | 性能       |
| P3     | 12   | `Object.freeze` 生产模式优化         | 性能       |
| P3     | 13   | `NavigationFailure.cause` 类型宽泛   | 类型安全   |
| P3     | 14   | `syncCurrentRoute` 的 `_from` 未使用 | 代码质量   |
| P3     | 15   | 开发模式专用警告                     | 调试       |
| P3     | 16   | 导航调试模式                         | 调试       |
| P4     | 17   | `params` 页面传参                    | 需额外适配 |
| P4     | 18   | 导航取消机制                         | 需额外适配 |
| P4     | 19   | `UniRouter` 类职责拆分               | 架构优化   |
