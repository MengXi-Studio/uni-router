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
