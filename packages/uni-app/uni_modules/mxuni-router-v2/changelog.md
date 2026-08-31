## 2.7.1（2026-08-31）

### 修复

- **H5 端返回死循环（"无法正常返回，一直来回闪烁"）** - 修复 `onBeforeBack` 在 H5 平台的 popstate 返回守卫导致相邻页面间死循环闪烁的问题（issue #39）
  - **现象**：H5 端按 首页 → 二级 → 三级 进入后，在三级页执行返回（`router.back()` 或浏览器后退）时，页面在二、三级之间高频反复切换、无法正常返回，控制台无 JS 报错
  - **根因**：H5 返回守卫原采用「`history.go(1)` 撤销后退 → 守卫放行后 `navigateBack` 重新后退」策略；`navigateBack` 在 H5 上会触发**多次**
    popstate，当这些自身 popstate 因派发时机滞后被误判为"新的外部后退"时，会再次进入「撤销 + 重放」分支，形成死循环
  - **修复方案**：`router.back()` 及守卫放行后的返回在发起 `navigateBack`
    前，置位 H5 返回进行中标记，并在**时间窗口内放行**本次导航产生的所有 popstate（不再进入「撤销 + 重放」分支）；同时**记录返回目标路径，命中目标 URL 即视为本次返回完成**（确定性结束），时间窗口作为兜底自动复位
  - **守卫语义保持**：守卫放行时正常返回上一页、守卫中止时停留当前页，均不再出现死循环
  - 涉及文件：`router/back-guard.ts`（H5 返回进行中标记 + 目标命中判定）、`router/index.ts`（`back()` 前置标记）

## 2.7.0（2026-08-30）

### 新增

- **H5 端导航动画（CSS 过渡）** - 导航动画能力从 App 端扩展到 H5 平台，通过注入的关键帧 CSS 实现与 App 端 `animationType` 命名对齐的过渡效果（基于 `transform` / `opacity`）
  - `push`（`uni.navigateTo`）成功后对目标页播放**进入动画**（`animatePageEnter`），经 `requestAnimationFrame` 延后到下一帧以等待页面完成渲染
  - `back`（`uni.navigateBack`）先对当前页播放**退出动画**（`animatePageExit`），动画结束后再执行真正的返回，使滑出效果与 App 端一致
  - 支持 `slide-in/out-*`、`fade-in/out`、`zoom`、`pop` 等方向键帧；动画结束（`animationend`）后自动清理样式，并带定时兜底避免页面快速切换时残留
  - 动画时长默认 `300ms`（`DEFAULT_ANIMATION_DURATION`），可通过 `duration` 覆盖
- **`plugins/animation/h5.ts` 模块** - H5 动画样式注入（幂等）与进入/退出动画播放逻辑。npm 发布产物由 tsup 构建、不处理 `#ifdef H5` 条件编译，故采用运行时 `getPlatform().isH5` 平台判断

### 优化

- **导航动画有效值统一在 router 层计算** - `meta.animation` 仅在注册 `AnimationPlugin` 时注入导航选项，未注册时即使配置 `meta.animation` 也不生效；`navigate.ts` 不再内部回退读取 `meta.animation`，与调用时传入 `animation`
  的 `PLUGIN_REQUIRED` 门控保持一致
- **动画平台能力统一** - App 端为原生窗口动画（`animationType`），H5 端 `push` / `back` 走 CSS 过渡，小程序端由宿主控制

### 重构

- 抽出 `navigation/helpers/uni-api.ts`、`plugins/animation/helpers`、`plugins/interceptor/helpers/parse.ts` 等助手模块，收敛导航 API 的 uni 调用与平台判断逻辑

## 2.6.0（2026-08-27）

### 新增

- **全局返回守卫 `onBeforeBack`** - 新增 `router.onBeforeBack()` 方法，拦截返回操作（App 物理返回键 / 顶部导航栏返回 / `uni.navigateBack`，H5 浏览器后退按钮 / 后退手势）
  - 返回 `false` 阻止返回，`true` / `undefined` 放行，支持异步（Promise），不受 uni-app `onBackPress` 同步返回限制
  - App 端通过全局 mixin 的 `onBackPress` 接入物理返回键 / 导航栏返回 / `navigateBack`；守卫放行后手动返回，通过内部标记避免递归
  - H5 端通过浏览器 `popstate` 事件接入后退，采用「撤销后退 → 执行守卫链 → 守卫放行后重新后退」策略
  - 守卫放行后复用 `beforeEach` → `beforeResolve` 守卫链，中止 / 重定向行为与完整导航一致
  - 新增 `BackGuard` / `BackGuardReturn` 类型
  - 平台限制：App / H5 可拦截；iOS 侧滑返回需配合 `app.setSideSlipGesture` 禁用手势；小程序原生返回无法拦截
- **iOS 侧滑返回手势控制（`app.setSideSlipGesture`）** - 新增 `RouterOptions.app` App 平台专属配置，按当前路由动态设置 iOS 侧滑返回手势（对应 `plus.webview.setStyle({ popGesture })`）
  - `'none'` 禁用侧滑返回，使侧滑返回走守卫链（`onBeforeBack` 生效）
  - `'close'` 开启原生侧滑返回，保留原生手势体验（侧滑绕过守卫）
  - 由全局 mixin 在页面 `onShow` 时自动调用，仅 iOS 平台生效
  - 新增 `AppRouterOptions` / `SideSlipGesture` 类型
- **`getPlatform()` 平台判断工具** - 统一平台判断入口，基于 `uni.getSystemInfoSync()` 并带缓存
  - 返回 `PlatformInfo`：`isApp` / `isH5` / `isMp` / `isIOS` / `isAndroid` / `uniPlatform` / `osName`
  - 兼容旧版本：`uniPlatform` 缺失时回退到 `typeof plus` / `typeof window` 推断 App / H5
  - 新增 `plus` 全局对象与 `uni.getSystemInfoSync()` 类型声明

### 优化

- **平台判断统一** - InterceptorPlugin 的 `isWebPlatform()` 改用 `getPlatform().isH5`，消除散落的 `typeof window` / `typeof document` 特殊判断

## 2.5.0（2026-08-23）

### 新增

- **RouterLink H5 端渲染为原生 `<a>` 标签** - 恢复浏览器链接的原生能力（语义化、右键新标签页、地址识别、无障碍、href 原生行为）
  - H5 端通过 `#ifdef H5` 条件编译渲染为 `<a :href>`，`href` 由 `useLink` 响应式提供；普通左键 `preventDefault` 后交由路由器导航，**守卫链照常生效**
  - 修饰键（Ctrl/Cmd/Shift/Alt）或中键点击保留浏览器原生行为（如新标签页打开）
  - `href` 自动适配 hash 路由（`#` 前缀），确保右键"在新标签页打开"能正确路由
  - 其他平台（App/小程序）渲染为 `<navigator>`（uni-app 原生导航组件），行为不变
  - 脚本中修饰键判断与 hash 前缀逻辑使用 `#ifdef H5` 条件编译，非 H5 平台编译期剔除，避免非 H5 事件对象无 `button` 属性导致导航被误拦截

## 2.4.0（2026-08-21）

### 新增

- **可控重定向（Controllable Redirect）** - 守卫返回值模式补全重定向方式控制能力，通过返回 `{ location, mode }` 对象可显式指定重定向使用的导航方式
  - 新增 `NavigationRedirect` 接口，扩展 `NavigationGuardReturn` 类型（增加 `| NavigationRedirect` 分支）
  - `mode` 支持 `'push'`（`uni.navigateTo`）/ `'replace'`（`uni.redirectTo`）/ `'relaunch'`（`uni.reLaunch`）
  - 重定向方式优先级：显式 `mode` > 原始导航方式 > `back` 回退 `relaunch`
  - `mode` 缺省时行为不变（沿用原始导航方式），完全向后兼容
  - `guardRoute()` 冷启动场景同步支持可控重定向
  - 示例：
    ```typescript
    router.beforeEach((to, from) => {
    	if (to.meta.requireAuth && !isLoggedIn()) {
    		// 用 replace 跳转登录页，避免登录页残留在页面栈中
    		return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
    	}
    })
    ```

### 修复

- **字符串路径含 query 时注入内部 key 产生双 `?`** - `injectQueryKey` 对已含 query 的字符串路径（如 `'/detail?id=1'`）注入 `__nav_id` / `__params_key` 时未拆分已有 query，导致拼接出 `?id=1?__nav_id=...` 的畸形 URL
  - 修复：字符串路径先按 `?` 拆分为 path + 已有 query，再合并注入，最终为 `?id=1&__nav_id=...`
  - 同时惠及 ChannelPlugin（`__nav_id`）与 ParamsPlugin（`__params_key`）

## 2.3.1（2026-08-20）

### 修复

- **RouterLink 组件 H5 端控制台错误** - 将根元素从 `<navigator>` 替换为 `<view>`，解决 H5 端每次点击时 uni-h5 输出 `[ERROR] <navigator/> should have url attribute` 控制台错误的问题
  - `<view>` 同样支持 `hover-class` / `hover-stop-propagation` / `hover-start-time` / `hover-stay-time` 等点击态属性
  - 实际导航完全由 `@click.stop="handleClick"` 调用路由器 API 完成，不影响导航功能

### 优化

- **组件 emits 类型重构** - 将 `RouterLinkEmits`、`TabBarEmits` 从 `interface` 改为 `type` 别名，与其他类型定义风格保持一致

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
