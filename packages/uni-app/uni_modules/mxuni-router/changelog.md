## 1.10.0（2026-07-09）

### 新增

- **内置页面间通信管理器** - 新增 `useUniEventChannel` 选项与 `UniEventChannel` 类，基于 `uni.$emit/$on/$off/$once` 全局事件总线实现，替代 `uni.navigateTo`
  原生 EventChannel，使所有导航方式（push/replace/relaunch）均支持页面间双向通信
  - `RouterOptions.useUniEventChannel?: boolean`（默认 `false`）- 启用后所有导航方式使用内置通信管理器；默认 `false` 时仅 `push` 使用 `uni.navigateTo` 原生 EventChannel，其他方式不支持页面通信
  - `UniEventChannel` 类 - 实现 `EventChannel` 接口，提供 `emit` / `on` / `once` / `off` 方法；每次导航生成唯一 `navigationId`（格式 `nav-<timestamp>-<seq>`），通过 `wrapEventName()` 包装为
    `uni-router:{navId}:{eventName}` 隔离事件通道，避免多导航间事件串扰
  - `__nav_id` 通过 URL query 传递，目标页面 `syncCurrentRoute` 时读取并重建通道，H5 刷新后仍可恢复通信
  - 新增 `noopChannel` 导出 - 空操作通道，所有方法均为 no-op 并返回自身；`usePageChannel()` 在无 `__navId` 时返回 `noopChannel`，避免空指针
- **Sticky 事件缓存机制** - `emit()` 始终将事件参数缓存到 `pendingEvents`，`on()` / `once()` 注册监听器时异步触发已缓存事件（不删除缓存），解决发送方 `emit` 与目标页 `setup` 注册监听的时序竞态
  - 适用场景：发起页导航后立即 `emit`，目标页 `setup` 中 `on` 监听时仍能收到缓存事件
  - 缓存随 `UniEventChannel.destroy()` 清理（页面 `onUnmounted` 时自动调用）
- **`usePageChannel()` 组合式 API** - 目标页面获取通信通道的便捷方法
  - 读取 `route.params.__navId`，返回对应的 `UniEventChannel` 实例；无 `__navId` 时返回 `noopChannel`
  - `onUnmounted()` 时自动调用 `destroyChannel(navId)` 清理监听器与缓存，避免内存泄漏
- **`NavigationResult` 返回类型** - `push` / `replace` / `relaunch` 返回值从 `RouteLocation` 扩展为 `NavigationResult`（继承 `RouteLocation`，新增可选 `eventChannel?: EventChannel`）
  - 默认模式：仅 `push`（对应 `uni.navigateTo`）的 `eventChannel` 可用
  - `useUniEventChannel: true`：所有导航方式均返回内置 `UniEventChannel`
  - 类型向后兼容：`NavigationResult extends RouteLocation`，原 `const route: RouteLocation = await router.push(...)` 仍可用
- **通道注册表（内部）** - `registerChannel` / `getOrCreateChannel` / `getRegisteredChannel` / `hasChannel` / `destroyChannel` 管理 `navId → UniEventChannel` 映射
  - `registerChannel` 采用 first-wins 策略：同一 `navId` 已存在通道时返回 false，避免重复注册
  - `getOrCreateChannel` 优先复用已注册通道，无则新建
- **`RouterLink` 的 `navigated` 事件支持所有导航方式** - 配合 `NavigationResult` 返回类型，`navigate()` 现对 push/replace/relaunch 统一触发 `navigated` 事件并传递
  `eventChannel`（默认模式仅 push 有值，`useUniEventChannel: true` 时所有方式均有值）；1.9.0 中 replace/relaunch 无 `eventChannel`，仅 push 触发为当时一致行为

### 优化

- **`RouterLink` 的 `events` prop 与 `navigated` 事件 JSDoc 完善** - 明确说明默认模式下 `events` 仅 `push` 生效、`navigated` 的 `eventChannel` 仅 `push` 有值；启用 `useUniEventChannel` 后所有导航方式均生效

## 1.9.0（2026-07-06）

### 新增

- **全局 mixin 自动同步路由状态** - `install()` 中注册 `app.mixin({ onShow() { router.syncRoute() } })`，每个页面 `onShow` 时自动同步路由状态，无需在各页面手动调用 `syncRoute()`
  - mixin 钩子先于组件自身 `onShow` 执行，配合 `syncRoute()` 的去重机制（path + query 相同则跳过）避免重复同步
  - 应用从后台回到前台时，当前活动页的 `onShow` 会自动触发同步，`App.vue` 的 `onShow` 无需手动调用
  - `onLoad` 早于 `onShow`，若需在 `onLoad` 中读取路由信息可手动调用 `syncRoute()`

### 修复

- **`back()` 后 params 丢失** - `push` / `replace` 时实际导航 URL 保留 `__params_key`（`route.query` 中不可见），`back()` 返回原页面后 `syncCurrentRoute` 从 URL 读取 key 并用 `peek` 重建 params
  - **问题**：`matcher.resolve` 会从 query 中移除 `__params_key`，导致实际导航 URL 不含 key，`back()` 后无法从 URL 重建 params
  - **修复**：`performNavigation` 在 resolve 后通过 `extractParamsKey` 提取 key，`executeNavigation` 将 key 拼回实际导航 URL 的 query 中；`syncCurrentRoute` 从 URL 读取 key 并用 `peek`（非
    `get`）重建 params，避免惰性清理误删
- **`setCurrentRoute` 执行时机** - `setCurrentRoute(to)` 提前到 uni 导航 API 调用之前执行，确保目标页 `onLoad` / `onShow` 时 `route.value` 已是完整目标路由（含 `name` / `params`）
  - **问题**：此前 `setCurrentRoute` 在 uni API 成功后执行，目标页 `onLoad` / `onShow` 触发时 `currentRoute` 仍为来源路由，导致 `route.value` 不含目标路由信息
  - **修复**：在调用 `navigateTo` / `replaceTo` / `relaunchTo` 之前调用 `setCurrentRoute(to)`；导航 API 失败时回滚到 `from`

## 1.8.1（2026-06-26）

### 修复

- **`interface` 对象无法赋值给 `params` 字段** - 解决 v1.8.0 中 `router.push({ params })` 传入 `interface` 定义的对象时类型报错的问题
  - **问题**：v1.8.0 中 `RouteLocationPathRaw.params` / `RouteLocationNamedRaw.params` 的类型为 `interface ParamObject`（带索引签名 `{ [key: string]: ParamValue }`）。TypeScript 严格模式下，`interface`
    定义的对象类型没有显式索引签名，无法赋值给带索引签名的类型，导致 `const params: MyInterface = {...}; router.push({ params })` 报错“缺少类型 'string' 的索引签名”
  - **修复**：新增 `ParamsInput` 类型（`object`）作为输入侧类型，`params` 字段改用 `ParamsInput`，通过结构子类型兼容任意 `interface` 对象；输出侧 `ParamObject` 从 `interface` 改为 `type`
    别名（`Record<string, ParamValue>`），保留索引签名访问
  - **设计说明**：参考 vue-router 的 `RouteParamsRawGeneric`（`Record<string, RouteParamValueRaw | ...[]>`）调研，发现其值类型仅含原始类型（`string | number | null | undefined`），原始类型属性的 `interface`
    对象可通过结构子类型兼容 `Record`；而 mxuni-router 的 `ParamValue` 包含 `object` / `ParamValue[]` 分支（支持复杂数据传递），此场景下 `Record<string, ParamValue>` 在 vue-tsc 严格模式下仍不兼容 `interface`
    对象，必须使用 `object`
  - 运行时由 `ParamsManager` 校验 JSON 可序列化性
  - 新增 `ParamsInput` 类型导出

## 1.8.0（2026-06-26）

### 新增

- **冷启动守卫检查 `guardRoute()`** - 解决用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入页面时，页面由 uni-app 框架直接加载、不经过路由器导航、守卫（beforeEach 等）未执行的问题
  - `Router.guardRoute(location?, options?)` - 对指定路由执行守卫链检查（不执行实际导航），按守卫结果决定是否重定向
  - `GuardRouteOptions` - 选项类型，包含 `onAbort` 回调，守卫中止时触发并传入 `NavigationFailure`
  - 行为：守卫放行 → 不执行导航，resolve 目标路由；守卫重定向 → 按守卫指定方式（默认 `relaunch`，清空栈避免返回受保护页面）跳转；守卫中止 → 调用 `onAbort` 回调并 reject `NavigationFailure`
  - 执行完整守卫链：`beforeEach` → `beforeEnter` → `beforeResolve`
  - 典型用法：在 `App.vue` 的 `onLaunch` 中 `router.isReady().then(() => router.guardRoute(undefined, { onAbort: () => router.relaunch('/pages/index/index') }))`
- **`UniApiError` / `UniApiCause` 类型导出** - 将原本内部的 uni API 错误类型导出，提升 `NavigationFailure.cause` 的类型可读性
  - `UniApiCause` - uni 导航 API `fail` 回调的错误原因类型（`{ errMsg: string }`）
  - `UniApiError` - 接口，包含 `api`（失败的 API 名称，如 `navigateTo`）和 `cause`（原始错误原因）字段
  - `NavigationFailure.cause` 类型从 `unknown` 收紧为 `UniApiError`，仅在 `NAVIGATION_API_ERROR` 时存在
  - `isUniApiError()` 改为类型守卫（`error is UniApiError`），便于 `instanceof` 后的类型收窄

### 优化

- **`ParamValue` 类型兼容性增强** - 对象分支从递归 `ParamObject` 改为 `object`，兼容 `interface` 定义的对象类型（它们没有索引签名，无法赋值给 `{ [key: string]: ... }`）；添加 `undefined`
  分支，兼容含可选属性的对象（`JSON.stringify` 会自动忽略 `undefined` 属性）
- **`RouterLink` 组件重构** - 将 location 计算逻辑提取为 `computed`，无附加选项（animation/events/persistent 均未传）时直接使用 `to`，避免无谓的对象包装
- **uni API `fail` 回调类型收紧** - `env.d.ts` 中各导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）的 `fail` 回调参数类型从 `unknown` 收紧为 `UniApiCause`

### 修复

- **守卫混用模式警告** - 当守卫同时调用 `next()` 并返回 Promise 时输出警告（`next()` 之后的异步错误会被静默吞掉，开发者应选择其中一种解析模式：`next()` 回调或 `async/await`，不可混用）
- **`syncCurrentRoute` 参数清理** - 移除 `syncRoute()` 内部未使用的 `_from` 参数

## 1.7.0（2026-06-25）

### 新增

- **守卫重定向方式可控** - `next()` 回调新增可选 `options` 参数，支持在守卫重定向时指定导航方式
  - `NavigationGuardNextOptions` - `next()` 回调的可选参数类型，包含 `mode` 字段
  - `NavigationRedirectMode` - 重定向方式类型（`'push' | 'replace' | 'relaunch'`）
  - `next(location, { mode })` - 重定向时指定使用 `push` / `replace` / `relaunch` 方式
  - 未指定 `mode` 时沿用触发守卫的原始导航方式（向后兼容）
  - 原始导航为 `back` 时，未指定 `mode` 则回退为 `relaunch`（因 `back` 无法跳转到页面栈外目标）

### 修复

- **H5 平台 `interceptUniApi` 导致 TabBar 点击卡死** - 1.6.3 通过调换执行顺序恢复了 switchTab 走守卫链，但 H5 平台下同步阻止 `uni.switchTab`
  仍会导致 TabBar 组件内部「切换中」状态无法清除，后续点击被忽略。现对 H5 平台的 switchTab 改用「放行原始调用 + success 回调同步状态」策略
  - 新增 `isWebPlatform()` 检测 H5 平台（通过 `window` / `document` 存在性判断）
  - 新增 `handleWebSwitchTab()` 包装 `success` 回调，在 switchTab 完成后调用 `router.syncRoute()` 同步路由状态
  - 权衡：H5 平台下外部 `uni.switchTab` 调用不再经过前置守卫，TabBar 页面权限控制需在页面 `onShow` 生命周期中处理
  - 小程序平台和 App 平台不受影响，仍走完整的「阻止 + 转发」流程

## 1.6.3（2026-06-24）

### 修复

- **`interceptUniApi` 导致 H5 端 TabBar 无法点击** - 拦截器 `invoke` 钩子中 `args.url = ''` 在 `handleInterceptedNavigation()` 之前执行，导致 `parseUniUrl('')` 返回空路径，`switchTab`
  导航被吞掉。H5 端 TabBar 是 Vue 组件，点击时调用 `uni.switchTab` 触发拦截器后 URL 被提前清空；小程序端 TabBar 是原生组件，点击不经过
  `uni.switchTab`，故不受影响。现已调换执行顺序，先解析 URL 并触发路由器导航，再清空 URL 作为双重保险，同时恢复 `switchTab` 走守卫链

## 1.6.2（2026-06-24）

### 修复

- **`isReady()` 执行时机修正** - `markReady()` 从 `setCurrentRoute()` 移到 `install()` 方法中，确保 `isReady()` 回调在所有插件（如 Pinia）安装完成后执行，而非在 `createRouter()` 构造时立即触发

## 1.6.1（2026-06-23）

### 优化

- **`isSameQuery` 空对象快速路径** - 添加引用相等（`a === b`）和双空对象（`keysA.length === 0`）快速返回，避免高频调用场景下不必要的 `Object.keys` 和 `every` 开销
- **`Object.freeze` 逻辑集中化** - 将 `meta`、`query`、`params` 的冻结逻辑从 `setCurrentRoute` 和 `createStartLocation` 集中到 `createRouteLocation` 工厂函数中，消除重复代码，后续条件冻结只需改一处

## 1.6.0（2026-06-23）

### 新增

- **页面参数传递（params）** - `push` / `replace` / `relaunch` 支持 `params` 参数，传递复杂数据（对象、数组等），不暴露在 URL 中，目标页面通过 `route.params` 读取
  - `RouteLocationPathRaw.params` / `RouteLocationNamedRaw.params` - 导航时传入页面参数，支持 JSON 可序列化数据
  - `RouteLocation.params` - 解析后的路由位置新增 `params` 字段（`Readonly<ParamObject>`），目标页面可直接读取
  - `ParamObject` / `ParamValue` 类型 - 页面参数类型定义，支持嵌套对象和数组
  - `QueryValue` 类型 - 查询参数值类型（`string | number | boolean`），用于 `query` 字段的输入类型
- **参数持久化存储** - `persistent` 选项将 params 持久化到 `uni.setStorageSync`，H5 刷新后仍可读取
  - `RouteLocationPathRaw.persistent` / `RouteLocationNamedRaw.persistent` - 单次导航指定是否持久化
  - `RouterOptions.paramsPersistent` - 全局默认值，设为 `true` 时所有 params 默认持久化，单次导航可通过 `persistent` 覆盖
- **查询参数增强方法** - `RouteLocation` 提供三个便捷方法，自动解析 query 参数为指定类型
  - `queryInt(key, defaultValue?)` - 将查询参数解析为整数，解析失败返回 `defaultValue`
  - `queryNumber(key, defaultValue?)` - 将查询参数解析为数值（支持浮点），解析失败返回 `defaultValue`
  - `queryBool(key, defaultValue?)` - 将查询参数解析为布尔值（`'true'`/`'1'` → `true`，`'false'`/`'0'` → `false`），无法识别返回 `defaultValue`
- **RouterLink `params` prop** - 声明式导航支持传递页面参数，对应 `push` 的 `params` 选项
- **RouterLink `persistent` prop** - 声明式导航支持参数持久化，对应 `push` 的 `persistent` 选项

## 1.5.0（2026-06-18）

### 新增

- **路由器就绪超时保护** - `readyTimeout` 配置项，防止路由器初始化异常时 `isReady()` Promise 永久挂起
  - `RouterOptions.readyTimeout` - 路由器就绪超时时间（毫秒），默认 `0`（永不超时），设为大于 0 时超时后 `isReady()` 将 reject
  - `router.isReady()` 超时 reject - 当配置了 `readyTimeout > 0` 且路由器在指定时间内未完成初始化时，`await router.isReady()` 将抛出超时错误

### 修复

- **`interceptUniApi` 拦截列表文档遗漏 `reLaunch`** - v1.0.0 文档仅列出 `navigateTo` / `redirectTo` / `switchTab` / `navigateBack` 四个 API，实际实现（含 v1.3.0 新增）拦截五个 API，已补充 `reLaunch` 到文档说明
- **`RouteMeta` 索引签名类型修正** - `[key: string]` 类型从 `unknown` 修正为 `any`，与实际实现保持一致
- **`router.back()` 返回值文档修正** - 返回值类型从 `Promise<void>` 修正为 `Promise<RouteLocation>`，与实际实现保持一致

## 1.4.0（2026-06-14）

### 新增

- **EventChannel 页面间通信** - `push` 支持 `events` 参数和 `eventChannel` 返回值，实现页面间双向通信
  - `RouteLocationPathRaw.events` / `RouteLocationNamedRaw.events` - 导航时传入事件监听器，监听目标页面通过 `eventChannel.emit` 发送的事件
  - `NavigationResult.eventChannel` - `push` 返回结果新增 `eventChannel` 字段，用于向目标页面发送事件
  - `EventChannel` 接口 - 完整的 `on` / `once` / `off` / `emit` 方法定义
  - `EventListeners` 类型 - 事件监听器映射类型
  - 非 push 模式（replace / relaunch）传入 `events` 时输出警告并忽略
  - TabBar 页面（switchTab）不支持 `events`，传入时输出警告并忽略
- **RouterLink `events` prop** - 声明式导航支持页面间通信，对应 `uni.navigateTo` 的 `events` 参数
- **RouterLink `@navigated` 事件** - 导航成功后触发，参数为 `EventChannel | undefined`，仅 push 模式返回 `eventChannel` 实例
- **uni API 拦截器支持 `events`** - 拦截 `uni.navigateTo` 时提取 `events` 参数转发到路由器
- **类型导出** - 新增 `EventChannel` 和 `EventListeners` 类型导出

## 1.3.0（2026-06-12）

### 新增

- **relaunch 导航方式** - `router.relaunch(location)` 关闭所有页面并打开目标页面，对应 `uni.reLaunch`
  - TabBar 页面自动切换为 `uni.switchTab`
  - `uni.reLaunch` 不支持动画参数，传入时输出警告
  - 不进行重复导航检测（清栈场景下目标页面可能就是当前页面）
  - 走完整守卫链（beforeEach → beforeEnter → beforeResolve → afterEach）
- **RouterLink `relaunch` prop** - 声明式导航支持 relaunch 模式，优先级高于 `replace`
- **uni API 拦截器新增 `reLaunch`** - 拦截 `uni.reLaunch` 调用，转发到 `router.relaunch()`

## 1.2.0（2026-06-11）

### 新增

- **导航动画** - 完整的页面切换动画支持，仅 App 端生效，其他平台自动忽略
  - `NavigationAnimation` 接口 - 动画配置类型，包含 `type` 和可选 `duration` 字段
  - `UniAnimationType` 类型 - 覆盖 uni-app 支持的全部动画类型（slide-in/out、fade-in/out、zoom-in/out、pop-in/out、auto、none）
  - `DEFAULT_ANIMATION_DURATION` 常量 - 默认动画持续时间 300ms
  - `RouteLocationPathRaw.animation` / `RouteLocationNamedRaw.animation` - 导航时传入动画参数，覆盖 `meta.animation`
  - `RouteMeta.animation` - 路由级默认动画配置
  - `back(delta?, animation?)` - `back()` 方法新增可选 `animation` 参数
  - `RouterLink` 组件新增 `animation` prop - 声明式导航支持动画
  - 动画优先级：`调用时传入` > `meta.animation` > `uni 默认值`

## 1.1.2（2026-06-10）

### 修复

- **`getCurrentPages()` 环境保护** - 新增 `safeGetCurrentPages()` 函数，在 SSR / Node 环境下 `getCurrentPages` 不存在时返回空数组，避免 `ReferenceError`
- **拦截器 `invoke` 低版本基础库兼容** - 拦截外部导航调用时先将 `args.url` 置为空字符串，防止低版本小程序基础库忽略返回值 `false` 而继续执行原始 API
- **拦截器重复安装警告** - `installInterceptors` 中检测到已有活跃管理器时输出 `console.warn`，提醒只支持单路由器实例

## 1.1.1（2026-06-10）

### 修复

- **`back()` 未触发 `afterEach` 守卫** - `router.back()` 导航完成后未执行 `afterEach` 后置钩子，现已修复
- **`back()` 守卫模式错误** - `back()` 导航的守卫模式从 `'push'` 修正为 `'back'`，确保守卫链正确识别返回导航
- **`syncRoute()` 忽略 query 变化** - `syncRoute()` 仅比较路径未比较查询参数，导致 query 变化时路由状态不同步，现已同时比较 path 和 query
- **`app.onUnmount` 兼容性** - `install` 中直接调用 `app.onUnmount` 在 uni-app 环境下报错（该 API 为 Vue 3.5+ 新增），已添加防御性检查

## 1.1.0（2026-06-09）

### 新增

- **守卫超时保护** - `guardTimeout` 配置项，守卫未在指定时间内调用 `next()` 时自动中止导航，默认 10000ms，设为 0 可禁用
- **路由变化监听** - `router.onRouteChange()` 注册路由状态变化监听器，导航完成和状态同步时触发，返回移除监听器的函数
- **路由状态同步标记** - `RouteLocation.synced` 字段，标识该路由变化是否由状态同步（如物理返回键）触发
- **RouterLink 错误事件** - `<mxuni-router>` 组件新增 `@error` 事件，导航失败时触发并传入 `NavigationFailure` 对象

### 优化

- **uni API 拦截增强** - `interceptUniApi` 拦截器逻辑优化，提升拦截稳定性
- **守卫执行增强** - 守卫链执行逻辑优化，支持超时保护与异常处理
- **组合式 API 增强** - `useRouter()` / `useRoute()` 内部实现优化
- **fullPath 确定性** - `buildFullPath` 对 query 参数键排序，确保相同 query 生成一致的 `fullPath`
- **install 类型修正** - `install(app)` 参数类型从 `unknown` 改为 `App`，提供更好的类型提示

## 1.0.0（2026-06-07）

### 新增

- **路由器核心** - `createRouter()` 创建路由器实例，支持 `routes`、`strict`、`interceptUniApi` 配置项
- **路由导航** - `router.push()` 导航到新页面，`router.replace()` 替换当前页面，`router.back()` 返回上一页
- **命名路由** - 通过 `name` 字段进行导航，无需硬编码路径字符串
- **路由元信息** - `meta` 字段支持 `title`、`isTab`、`requireAuth` 及自定义扩展字段
- **全局前置守卫** - `router.beforeEach()` 在每次导航前执行，支持中止、放行和重定向
- **全局解析守卫** - `router.beforeResolve()` 在所有前置守卫和路由独享守卫完成后执行
- **全局后置钩子** - `router.afterEach()` 在导航完成后执行
- **路由独享守卫** - `beforeEnter` 配置项，进入特定路由时触发
- **守卫重定向** - 守卫中调用 `next(location)` 可重定向到其他路由，支持多级重定向（最大深度 10）
- **组合式 API** - `useRouter()` 获取路由器实例，`useRoute()` 获取当前路由位置
- **错误处理** - `RouterError` 路由错误类，`NavigationFailure` 导航失败类（包含 `to`、`from`、`cause` 信息）
- **全局错误捕获** - `router.onError()` 注册错误处理回调
- **路由查询** - `router.resolve()` 解析路由位置（不执行导航），`router.getRoutes()` 获取所有路由配置，`router.hasRoute()` 检查路由是否存在
- **TypeScript 类型提示** - `RouteNameMap` 接口支持模块增强，为路由名称和路径提供自动补全和类型检查
- **uni API 拦截** - `interceptUniApi` 选项可拦截 `uni.navigateTo` / `uni.redirectTo` / `uni.switchTab` / `uni.navigateBack`，统一走路由守卫流程
- **重复导航检测** - `push` 到当前页面时自动拒绝并抛出 `NAVIGATION_DUPLICATED` 错误
- **并发导航排队** - 多次并发导航自动排队，前一次完成后再执行下一次
- **路径自动规范化** - 路径自动补全前导 `/`，查询字符串自动解析为 `query` 对象

### 错误码

| 错误码                  | 说明                               |
| ----------------------- | ---------------------------------- |
| `NAVIGATION_ABORTED`    | 导航被守卫中止                     |
| `NAVIGATION_CANCELLED`  | 导航被取消（守卫异常或重定向超限） |
| `NAVIGATION_DUPLICATED` | 重复导航到当前位置                 |
| `ROUTE_NOT_FOUND`       | 未找到匹配的路由                   |
| `NAVIGATION_API_ERROR`  | uni 导航 API 调用失败              |
| `SETUP_ERROR`           | 路由器初始化或使用方式错误         |
