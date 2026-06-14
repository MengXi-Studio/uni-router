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
