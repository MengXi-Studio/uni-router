## 2.3.0（2026-08-19）

### 新增

- **`useLink` 组合式 API** - 暴露 RouterLink 内部行为为组合式函数，用于构建自定义导航组件
  - 与 Vue Router 4.x 的 `useLink` 行为一致，返回响应式的路由信息、匹配状态和导航方法
  - 返回值：`route`（解析后的路由）、`href`（目标路径）、`isActive`（是否匹配）、`isExactActive`（是否完全匹配）、`navigate`（执行导航）
  - 示例：
    ```typescript
    import { useLink } from '@meng-xi/uni-router'

    const { href, isActive, navigate } = useLink({
    	to: { name: 'pagesDetailDetail', query: { id: '1' } }
    })

    // 响应式绑定
    const classes = computed(() => ({
    	'nav-link': true,
    	'nav-link-active': isActive.value
    }))
    ```
- **`isNavigationFailure` 工具函数** - 导航失败类型检查工具，替代手动 `instanceof` + `code` 检查
  ```typescript
  import { isNavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

  try {
  	await router.push('/somewhere')
  } catch (error) {
  	if (isNavigationFailure(error, RouterErrorCode.NAVIGATION_DUPLICATED)) {
  		// 忽略重复导航
  	}
  }
  ```
- **`UseLinkOptions` / `UseLinkReturn` 类型** - `useLink` 的选项和返回值类型

## 2.2.0（2026-08-18）

### 破坏性变更

- **彻底移除 `next()` 回调模式** - 守卫系统全面采用返回值模式，与 Vue Router 4.x 完全一致
  - 删除 `NavigationGuardNext` 类型，不再支持 `(to, from, next)` 三参数签名
  - 删除 `NavigationGuardNextOptions` 类型，`next(location, { mode })` 不再可用
  - 删除 `runGuardWithNext()` 函数，移除整个 `next` 回调执行路径
  - 删除 `runGuard()` 模式检测分发器，由仅支持返回值模式的 `runGuard()` 替代
  - `NavigationGuard` 类型签名从 `(to, from, next?)` 改为 `(to, from)`
  - 守卫仅通过返回值控制导航行为：
    - `return undefined` / `return true` → 放行
    - `return false` → 中止导航（`NAVIGATION_ABORTED`）
    - `return '/login'` / `return { name: 'login' }` → 重定向
    - `return new Error()` / `throw new Error()` → 取消导航（`NAVIGATION_CANCELLED`）

### 新增

- **`onBeforeRouteLeave` 组合式 API** - 组件内离开守卫，通过返回值控制离开导航，组件卸载时自动移除守卫
  - 与 Vue Router 4.x 的 `onBeforeRouteLeave` 行为一致，支持同步和异步守卫
  - 示例：
    ```typescript
    import { onBeforeRouteLeave } from '@meng-xi/uni-router'

    // 同步离开确认
    onBeforeRouteLeave(() => {
    	if (hasUnsavedChanges) {
    		return false
    	}
    })

    // 异步确认对话框
    onBeforeRouteLeave(() => {
    	if (hasUnsavedChanges) {
    		return new Promise(resolve => {
    			uni.showModal({
    				title: '确认离开',
    				content: '有未保存的修改，确定要离开吗？',
    				success: res => resolve(res.confirm)
    			})
    		})
    	}
    })
    ```
- **`RouteLeaveGuard` 类型** - 组件内离开守卫函数类型，与 `NavigationGuard` 返回值一致

### 重要限制

`onBeforeRouteLeave` 只能拦截经过路由器的导航（`push` / `replace` / `back` / `relaunch`），无法拦截物理返回键、侧滑返回手势、浏览器后退按钮、小程序左上角返回按钮等场景。

### 迁移指南

1. 将 `(to, from, next) => { next() }` 改写为 `(to, from) => { return }`
2. `next(false)` → `return false`
3. `next({ name: 'login' })` → `return { name: 'login' }`
4. `next({ name: 'login' }, { mode: 'replace' })` → `return { name: 'login' }`（`mode` 不再支持，重定向方式沿用原始导航方式）

## 2.1.0（2026-08-17）

### 新增

- **守卫返回值模式** - 守卫支持通过返回值控制导航行为，无需调用 `next()` 回调
  - `return undefined` / `return true` — 放行
  - `return false` — 中止导航（`NAVIGATION_ABORTED`）
  - `return RouteLocationRaw` — 重定向
  - `return Error` / `throw Error` — 取消导航（`NAVIGATION_CANCELLED`）
- **`NavigationGuardReturn` 类型** - 守卫返回值类型，支持 `void | undefined | boolean | RouteLocationRaw | Error | null`
- **`afterEach` 接收 `failure` 参数** - 后置钩子第三个参数 `failure` 在导航失败时传入，可用于区分成功/失败导航

### 兼容性

- `next()` 回调模式保持完全兼容
- 旧版守卫代码无需修改即可继续使用

## 2.0.0（2026-07-13）

### 新增

- **插件架构** - 核心功能拆分为按需注册的插件，未注册的插件不增加包体积和运行时开销
  - `RouterPlugin` 接口 - Swiper.js 风格的插件系统，通过 `install(context, options)` 注册 hook
  - `PluginContext` 接口 - 路由器暴露给插件的 hook 注册 API，支持 7 种生命周期 hook
  - `RouterOptions.plugins` - 插件注册配置项，传入插件数组即可启用对应功能
  - `PLUGIN_REQUIRED` 错误码 - 使用未注册插件的功能时抛出，帮助快速定位问题
- **ParamsPlugin** - 页面参数传递插件（从核心拆分）
  - `push` / `replace` / `relaunch` 支持 `params` 参数传递复杂数据，不暴露在 URL 中
  - 参数持久化存储 `persistent`，H5 刷新后仍可读取
  - `RouterOptions.paramsPersistent` 全局默认值
- **ChannelPlugin** - 页面间通信插件（从核心拆分并增强）
  - `useUniEventChannel` 选项 - 启用后所有导航方式（push/replace/relaunch）均支持 `eventChannel`
  - `UniEventChannel` 类 - 基于 `uni.$emit/$on/$off/$once` 全局事件总线实现，替代仅 push 可用的原生 EventChannel
  - Sticky 事件缓存机制 - `emit()` 始终缓存事件参数，`on()` / `once()` 注册时异步触发已缓存事件，解决时序竞态
  - `usePageChannel()` 组合式 API - 目标页面获取通信通道的便捷方法
  - `noopChannel` 导出 - 空操作通道，无 `__navId` 时返回，避免空指针
- **InterceptorPlugin** - uni API 拦截插件（从核心拆分）
  - `RouterOptions.interceptUniApi` 选项需要此插件才能生效
  - 拦截 `navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`，统一守卫流程
- **AnimationPlugin** - 导航动画插件（从核心拆分）
  - `push` / `replace` / `back` 支持动画参数，仅 App 端生效
  - 路由级 `meta.animation` 默认动画配置
- **`applySyncHooks` 导航预处理** - 在 `setCurrentRoute` 前执行 `routeSyncHooks`，将 `__nav_id` 等内部 key 从 query 提取到 params，确保目标页 `onLoad` / `<script setup>` 时 `usePageChannel()` 能正确获取通道

### 优化

- **`syncRoute` 去重优化** - 比较前先执行 `runSyncHooks` 移除 URL query 中的内部 key（如 `__nav_id`、`__params_key`），避免因内部 key 差异导致 `onShow` 每次触发多余的 `onRouteChange` 事件
- **路由位置解析逻辑集中** - `router/index.ts` 中的 `resolveLocation` / `extractParamsKey` 等逻辑提取到 `utils/route.ts`，消除与 `router/location.ts` 的重复
- **插件间数据共享** - `pluginData: Record<string, any>` 在导航流程各阶段间传递，插件通过约定 key 存取数据，避免直接耦合

### 破坏性变更

- **`createRouter` 必须显式注册插件** - `params` / `events` / `animation` / `interceptUniApi` 功能不再默认可用，需在 `plugins` 数组中注册对应插件
  ```typescript
  // 1.x - 功能默认可用
  const router = createRouter({ routes, interceptUniApi: true })

  // 2.0 - 需要显式注册插件
  const router = createRouter({
  	routes,
  	plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin],
  	interceptUniApi: true
  })
  ```
- **`@meng-xi/uni-router/plugins` 子路径导出** - 插件从主入口 `@meng-xi/uni-router` 和子路径 `@meng-xi/uni-router/plugins` 均可导入
- **未注册插件功能抛出 `PLUGIN_REQUIRED`** - 使用 `params` 但未注册 ParamsPlugin、使用 `events` 但未注册 ChannelPlugin、使用 `animation` 但未注册 AnimationPlugin、设置 `interceptUniApi: true`
  但未注册 InterceptorPlugin 时，均抛出 `PLUGIN_REQUIRED` 错误

### 迁移指南

1. 在 `createRouter` 中添加 `plugins` 数组，按需注册功能插件
2. 从 `@meng-xi/uni-router` 导入插件：`import { ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin } from '@meng-xi/uni-router'`
3. `usePageChannel()` 从 `@meng-xi/uni-router` 主入口导入
4. uni_modules 版本从 `./uni_modules/mxuni-router-v2/js_sdk/index.js` 导入
