# @meng-xi/uni-router 优化点分析

基于 uni-app 全平台兼容性（H5、微信/支付宝/百度/字节/QQ 小程序、App）对 `packages/core` 库进行审查，梳理出以下优化点。

优先级说明：

- **P0**：功能缺陷，影响正确性
- **P1**：uni-app 功能缺失，影响开发体验
- **P2**：健壮性与 API 设计问题
- **P3**：性能优化和代码质量
- **P4**：非 uni-app 原生支持的能力，需额外适配或暂不考虑

---

## 一、性能优化与代码质量

### 1. `NavigationFailure.cause` 类型为 `unknown` 过于宽泛

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

### 2. `syncCurrentRoute` 的 `_from` 参数未使用

**文件**: `src/router/index.ts` L463

`syncCurrentRoute(_from: RouteLocation)` 接收 `from` 参数但未使用。`back()` 调用时传入的 `from` 值被浪费。如果需要基于 `from` 做判断（如区分 back 和 push 的同步），当前设计无法支持。

### 3. 缺少开发模式专用警告

以下场景应在 `__DEV__` 模式下输出警告：

- `back()` 在页面栈只有 1 页时调用
- 守卫中同时使用 `async/await` 和 `next()` 回调（容易导致双重解析）
- `syncRoute()` 在 `onHide` 而非 `onShow` 中调用
- `push` 到 TabBar 页面时携带了 query 参数（`uni.switchTab` 不支持 query）

### 4. 缺少导航调试模式

建议增加 `RouterOptions.debug` 选项，开启后输出完整的导航流程日志（守卫执行、API 调用、状态变更），方便小程序开发者工具中排查导航问题。

---

## 二、非 uni-app 原生支持的能力（暂不考虑）

以下功能在 uni-app 中无原生对应或需大量额外适配，建议放在最后考虑：

### 5. 导航取消机制（AbortController 风格）

当前导航一旦开始无法从外部取消。`AbortController` 风格的取消机制在 uni-app 中没有原生支持，需要自行实现超时和状态管理。

**不优先的原因**: uni-app 的导航 API 本身不支持取消（`uni.navigateTo` 无 abort 能力），实现取消仅能阻止守卫链继续执行，无法真正取消已发出的原生 API 调用。实际收益有限。

### 6. `UniRouter` 类职责拆分

`UniRouter` 类（523 行）承担了导航执行、守卫协调、状态同步、拦截器管理、Vue 插件安装等职责。

**不优先的原因**: 拆分属于架构优化，不影响功能和兼容性。当前规模尚可维护，待功能稳定后再重构。

---

## 优先级排序

| 优先级 | 编号 | 优化点                               | 类型       |
| ------ | ---- | ------------------------------------ | ---------- |
| P3     | 1    | `NavigationFailure.cause` 类型宽泛   | 类型安全   |
| P3     | 2    | `syncCurrentRoute` 的 `_from` 未使用 | 代码质量   |
| P3     | 3    | 开发模式专用警告                     | 调试       |
| P3     | 4    | 导航调试模式                         | 调试       |
| P4     | 5    | 导航取消机制                         | 需额外适配 |
| P4     | 6    | `UniRouter` 类职责拆分               | 架构优化   |
