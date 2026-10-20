# 更新日志

本项目的变更记录遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.7.1] - 2026-08-31

### 修复

- **H5 端返回死循环（"无法正常返回，一直来回闪烁"）** - 修复 `onBeforeBack` 在 H5 平台的 popstate 返回守卫导致相邻页面间死循环闪烁的问题（issue #39）
  - **现象**：H5 端按 首页 → 二级 → 三级 进入后，在三级页执行返回（`router.back()` 或浏览器后退）时，页面在二、三级之间高频反复切换、无法正常返回，控制台无 JS 报错
  - **根因**：H5 返回守卫原采用「`history.go(1)` 撤销后退 → 守卫放行后 `navigateBack` 重新后退」策略；`navigateBack` 在 H5 上会触发**多次** popstate，当这些自身 popstate 因派发时机滞后被误判为"新的外部后退"时，会再次进入「撤销 + 重放」分支，形成死循环
  - **修复方案**：`router.back()` 及守卫放行后的返回在发起 `navigateBack` 前，置位 H5 返回进行中标记，并在**时间窗口内放行**本次导航产生的所有 popstate（不再进入「撤销 + 重放」分支）；同时**记录返回目标路径，命中目标 URL 即视为本次返回完成**（确定性结束），时间窗口作为兜底自动复位
  - **守卫语义保持**：守卫放行时正常返回上一页、守卫中止时停留当前页，均不再出现死循环
  - 涉及文件：`router/back-guard.ts`（H5 返回进行中标记 + 目标命中判定）、`router/index.ts`（`back()` 前置标记）

## [2.7.0] - 2026-08-30

### 新增

- **H5 端导航动画（CSS 过渡）** - 导航动画能力从 App 端扩展到 H5 平台，通过注入的关键帧 CSS 实现与 App 端 `animationType` 命名对齐的过渡效果（基于 `transform` / `opacity`）
  - `push`（`uni.navigateTo`）成功后对目标页播放**进入动画**（`animatePageEnter`），经 `requestAnimationFrame` 延后到下一帧以等待页面完成渲染
  - `back`（`uni.navigateBack`）先对当前页播放**退出动画**（`animatePageExit`），动画结束后再执行真正的返回，使滑出效果与 App 端一致
  - 支持 `slide-in/out-*`、`fade-in/out`、`zoom`、`pop` 等方向键帧；动画结束（`animationend`）后自动清理样式，并带定时兜底避免页面快速切换时残留
  - 动画时长默认 `300ms`（`DEFAULT_ANIMATION_DURATION`），可通过 `duration` 覆盖
- **`plugins/animation/h5.ts` 模块** - H5 动画样式注入（幂等）与进入/退出动画播放逻辑。npm 发布产物由 tsup 构建、不处理 `#ifdef H5` 条件编译，故采用运行时 `getPlatform().isH5` 平台判断

### 优化

- **导航动画有效值统一在 router 层计算** - `meta.animation` 仅在注册 `AnimationPlugin` 时注入导航选项，未注册时即使配置 `meta.animation` 也不生效；`navigate.ts` 不再内部回退读取 `meta.animation`，与调用时传入 `animation` 的 `PLUGIN_REQUIRED` 门控保持一致
- **动画平台能力统一** - App 端为原生窗口动画（`animationType`），H5 端 `push` / `back` 走 CSS 过渡，小程序端由宿主控制

### 重构

- 抽出 `navigation/helpers/uni-api.ts`、`plugins/animation/helpers`、`plugins/interceptor/helpers/parse.ts` 等助手模块，收敛导航 API 的 uni 调用与平台判断逻辑

## [2.6.0] - 2026-08-27

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

## [2.5.0] - 2026-08-23

### 新增

- **RouterLink H5 端渲染为原生 `<a>` 标签** - 恢复浏览器链接的原生能力（语义化、右键新标签页、地址识别、无障碍、href 原生行为）
  - H5 端通过 `#ifdef H5` 条件编译渲染为 `<a :href>`，`href` 由 `useLink` 响应式提供；普通左键 `preventDefault` 后交由路由器导航，**守卫链照常生效**
  - 修饰键（Ctrl/Cmd/Shift/Alt）或中键点击保留浏览器原生行为（如新标签页打开）
  - `href` 自动适配 hash 路由（`#` 前缀），确保右键"在新标签页打开"能正确路由
  - 其他平台（App/小程序）渲染为 `<navigator>`（uni-app 原生导航组件），行为不变
  - 脚本中修饰键判断与 hash 前缀逻辑使用 `#ifdef H5` 条件编译，非 H5 平台编译期剔除，避免非 H5 事件对象无 `button` 属性导致导航被误拦截

## [2.4.0] - 2026-08-21

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

## [2.3.1] - 2026-08-21

### 修复

- **RouterLink 组件 H5 端控制台错误** - 将根元素从 `<navigator>` 替换为 `<view>`，解决 H5 端每次点击时 uni-h5 输出 `[ERROR] <navigator/> should have url attribute` 控制台错误的问题
  - `<view>` 同样支持 `hover-class` / `hover-stop-propagation` / `hover-start-time` / `hover-stay-time` 等点击态属性
  - 实际导航完全由 `@click.stop="handleClick"` 调用路由器 API 完成，不影响导航功能

### 优化

- **组件 emits 类型重构** - 将 `RouterLinkEmits`、`TabBarEmits` 从 `interface` 改为 `type` 别名，与其他类型定义风格保持一致

## [2.3.0] - 2026-08-19

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

## [2.2.0] - 2026-08-18

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

## [2.1.0] - 2026-08-16

### 新增

- **守卫返回值模式（Vue Router 4.x 兼容）** - 守卫全面支持通过返回值控制导航行为，无需调用 `next()` 回调
  - `return undefined` / `return true` — 放行
  - `return false` — 中止导航（`NAVIGATION_ABORTED`）
  - `return RouteLocationRaw` — 重定向
  - `return Error` / `throw Error` — 取消导航（`NAVIGATION_CANCELLED`）
  - `return { location, mode }` — 重定向 + 指定导航方式
- **`NavigationGuardReturn` 类型** - 守卫返回值类型，支持 `void | undefined | boolean | RouteLocationRaw | Error | null`
- **`afterEach` 接收 `failure` 参数** - 后置钩子第三个参数 `failure` 在导航失败时传入，可用于区分成功/失败导航

### 优化

- **守卫模式自动检测** - 通过函数参数个数自动识别模式：`(to, from, next)` 三个参数→回调模式（兼容旧版），`(to, from)` 两个参数→返回值模式（推荐）
- **混用警告** - 同时使用 `next()` 回调和返回值时，控制台输出警告提示

### 兼容性

- `next()` 回调模式保持完全兼容，标记为已弃用
- 旧版守卫代码无需修改即可继续使用

## [2.0.0] - 2026-07-13

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
- **未注册插件功能抛出 `PLUGIN_REQUIRED`** - 使用 `params` 但未注册 ParamsPlugin、使用 `events` 但未注册 ChannelPlugin、使用 `animation` 但未注册 AnimationPlugin、设置 `interceptUniApi: true` 但未注册 InterceptorPlugin 时，均抛出 `PLUGIN_REQUIRED` 错误

### 迁移指南

1. 在 `createRouter` 中添加 `plugins` 数组，按需注册功能插件
2. 从 `@meng-xi/uni-router` 导入插件：`import { ParamsPlugin, ChannelPlugin, InterceptorPlugin, AnimationPlugin } from '@meng-xi/uni-router'`
3. `usePageChannel()` 从 `@meng-xi/uni-router` 主入口导入
4. uni_modules 版本从 `./uni_modules/mxuni-router-v2/js_sdk/index.js` 导入

## [1.11.0] - 2026-07-10

### 新增

- **TabBar / TabBarItem 组件** - 自定义底部导航栏，需配合使用
  - TabBar Props：`color` / `selectedColor` / `bgColor` / `borderStyle` / `fixed` / `border` / `placeholder` / `safeAreaInsetBottom` / `zIndex` / `beforeChange`
  - TabBar Events：`change(item, index)` / `error(error)`
  - TabBarItem Props：`to` / `text` / `iconPath` / `selectedIconPath` / `dot` / `badge` / `badgeMax` / `badgeColor` / `replace`
  - TabBarItem Slots：`#icon="{ active }"` 自定义图标、`default` 自定义文字
  - 内置徽标系统：`dot` 小红点（优先级高于 badge）、`badge` 数字/文字徽标、`badgeMax` 上限、`badgeColor` 自定义颜色
  - `beforeChange` 拦截器：返回 `false` 或 reject 阻止切换，支持异步
- **SCSS 主题定制** - 组件样式迁移到 SCSS，支持双层级覆盖
  - SCSS 变量 `!default`：编译时覆盖（通过 vite `css.preprocessorOptions.scss.additionalData`）
  - CSS 自定义属性：运行时覆盖（在父元素设置 `--mx-tabbar-*` / `--mx-tabbar-item-*`）
  - TabBar 变量：`--mx-tabbar-height` / `--mx-tabbar-background` / `--mx-tabbar-border-color`
  - TabBarItem 变量：`--mx-tabbar-item-icon-size` / `--mx-tabbar-item-font-size` / `--mx-tabbar-item-gap` / `--mx-tabbar-badge-color` / `--mx-tabbar-badge-dot-size` / `--mx-tabbar-badge-font-size` / `--mx-tabbar-badge-min-width` / `--mx-tabbar-badge-line-height` / `--mx-tabbar-badge-padding`
- **`TabBarItemProps` 类型导出** - 从 `@meng-xi/uni-router` 主入口新增导出，用于 TabBar `change` 事件回调类型标注

### 优化

- **组件目录按 easycom 规范重构** - 组件从扁平文件改为 `components/<name>/<name>.vue` 嵌套结构，符合 easycom 自动注册约定
  - `components/RouterLink.vue` → `components/router-link/router-link.vue`
  - `components/TabBar.vue` → `components/tab-bar/tab-bar.vue`
  - `components/TabBarItem.vue` → `components/tab-bar-item/tab-bar-item.vue`
  - 共享上下文 `tabbar-context.ts` → `tab-bar/context.ts`
  - 组件类型提取到同级 `type.ts`（`router-link/type.ts`、`tab-bar/type.ts`）
- **uni_modules 版本组件导入改为本地 js_sdk** - mxuni-router 包内组件从 `@meng-xi/uni-router` 改为相对路径引用 `../../js_sdk/index`，消除对 npm 包的运行时依赖
- **uni_modules 版本标签名变更** - `<mxuni-router>` 改为 `<RouterLink>`（easycom 自动注册）
- **组件 TypeScript 类型提取** - 各组件 props/emits 类型提取到同级 `type.ts`，共享上下文（InjectionKey + 接口）放在 `context.ts`
- **组件 CSS → SCSS** - RouterLink、TabBar、TabBarItem 样式全部迁移到 SCSS，使用变量和自定义属性

### 迁移说明

npm 用户需更新组件导入路径：

| 旧路径                                          | 新路径                                                         |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `@meng-xi/uni-router/components/RouterLink.vue` | `@meng-xi/uni-router/components/router-link/router-link.vue`   |
| `@meng-xi/uni-router/components/TabBar.vue`     | `@meng-xi/uni-router/components/tab-bar/tab-bar.vue`           |
| `@meng-xi/uni-router/components/TabBarItem.vue` | `@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue` |

uni_modules 用户无需修改，easycom 自动注册 `<RouterLink>` / `<TabBar>` / `<TabBarItem>`。

## [1.10.0] - 2026-07-09

### 新增

- **内置页面间通信管理器** - 新增 `useUniEventChannel` 选项与 `UniEventChannel` 类，基于 `uni.$emit/$on/$off/$once` 全局事件总线实现，替代 `uni.navigateTo` 原生 EventChannel，使所有导航方式（push/replace/relaunch）均支持页面间双向通信
  - `RouterOptions.useUniEventChannel?: boolean`（默认 `false`）- 启用后所有导航方式使用内置通信管理器；默认 `false` 时仅 `push` 使用 `uni.navigateTo` 原生 EventChannel，其他方式不支持页面通信
  - `UniEventChannel` 类 - 实现 `EventChannel` 接口，提供 `emit` / `on` / `once` / `off` 方法；每次导航生成唯一 `navigationId`（格式 `nav-<timestamp>-<seq>`），通过 `wrapEventName()` 包装为 `uni-router:{navId}:{eventName}` 隔离事件通道，避免多导航间事件串扰
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
- **`RouterLink` 的 `navigated` 事件支持所有导航方式** - 配合 `NavigationResult` 返回类型，`navigate()` 现对 push/replace/relaunch 统一触发 `navigated` 事件并传递 `eventChannel`（默认模式仅 push 有值，`useUniEventChannel: true` 时所有方式均有值）；1.9.0 中 replace/relaunch 无 `eventChannel`，仅 push 触发为当时一致行为

### 优化

- **`RouterLink` 的 `events` prop 与 `navigated` 事件 JSDoc 完善** - 明确说明默认模式下 `events` 仅 `push` 生效、`navigated` 的 `eventChannel` 仅 `push` 有值；启用 `useUniEventChannel` 后所有导航方式均生效

## [1.9.0] - 2026-07-06

### 新增

- **全局 mixin 自动同步路由状态** - `install()` 中注册 `app.mixin({ onShow() { router.syncRoute() } })`，每个页面 `onShow` 时自动同步路由状态，无需在各页面手动调用 `syncRoute()`
  - mixin 钩子先于组件自身 `onShow` 执行，配合 `syncRoute()` 的去重机制（path + query 相同则跳过）避免重复同步
  - 应用从后台回到前台时，当前活动页的 `onShow` 会自动触发同步，`App.vue` 的 `onShow` 无需手动调用
  - `onLoad` 早于 `onShow`，若需在 `onLoad` 中读取路由信息可手动调用 `syncRoute()`

### 修复

- **`back()` 后 params 丢失** - `push` / `replace` 时实际导航 URL 保留 `__params_key`（`route.query` 中不可见），`back()` 返回原页面后 `syncCurrentRoute` 从 URL 读取 key 并用 `peek` 重建 params
  - **问题**：`matcher.resolve` 会从 query 中移除 `__params_key`，导致实际导航 URL 不含 key，`back()` 后无法从 URL 重建 params
  - **修复**：`performNavigation` 在 resolve 后通过 `extractParamsKey` 提取 key，`executeNavigation` 将 key 拼回实际导航 URL 的 query 中；`syncCurrentRoute` 从 URL 读取 key 并用 `peek`（非 `get`）重建 params，避免惰性清理误删
- **`setCurrentRoute` 执行时机** - `setCurrentRoute(to)` 提前到 uni 导航 API 调用之前执行，确保目标页 `onLoad` / `onShow` 时 `route.value` 已是完整目标路由（含 `name` / `params`）
  - **问题**：此前 `setCurrentRoute` 在 uni API 成功后执行，目标页 `onLoad` / `onShow` 触发时 `currentRoute` 仍为来源路由，导致 `route.value` 不含目标路由信息
  - **修复**：在调用 `navigateTo` / `replaceTo` / `relaunchTo` 之前调用 `setCurrentRoute(to)`；导航 API 失败时回滚到 `from`

## [1.8.1] - 2026-06-26

### 修复

- **`interface` 对象无法赋值给 `params` 字段** - 解决 v1.8.0 中 `router.push({ params })` 传入 `interface` 定义的对象时类型报错的问题
  - **问题**：v1.8.0 中 `RouteLocationPathRaw.params` / `RouteLocationNamedRaw.params` 的类型为 `interface ParamObject`（带索引签名 `{ [key: string]: ParamValue }`）。TypeScript 严格模式下，`interface` 定义的对象类型没有显式索引签名，无法赋值给带索引签名的类型，导致 `const params: MyInterface = {...}; router.push({ params })` 报错"缺少类型 'string' 的索引签名"
  - **修复**：新增 `ParamsInput` 类型（`object`）作为输入侧类型，`params` 字段改用 `ParamsInput`，通过结构子类型兼容任意 `interface` 对象；输出侧 `ParamObject` 从 `interface` 改为 `type` 别名（`Record<string, ParamValue>`），保留索引签名访问
  - **设计说明**：参考 vue-router 的 `RouteParamsRawGeneric`（`Record<string, RouteParamValueRaw | ...[]>`）调研，发现其值类型仅含原始类型（`string | number | null | undefined`），原始类型属性的 `interface` 对象可通过结构子类型兼容 `Record`；而 mxuni-router 的 `ParamValue` 包含 `object` / `ParamValue[]` 分支（支持复杂数据传递），此场景下 `Record<string, ParamValue>` 在 vue-tsc 严格模式下仍不兼容 `interface` 对象，必须使用 `object`
  - 运行时由 `ParamsManager` 校验 JSON 可序列化性
  - 新增 `ParamsInput` 类型导出

## [1.8.0] - 2026-06-25

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

- **`ParamValue` 类型兼容性增强** - 对象分支从递归 `ParamObject` 改为 `object`，兼容 `interface` 定义的对象类型（它们没有索引签名，无法赋值给 `{ [key: string]: ... }`）；添加 `undefined` 分支，兼容含可选属性的对象（`JSON.stringify` 会自动忽略 `undefined` 属性）
- **`RouterLink` 组件重构** - 将 location 计算逻辑提取为 `computed`，无附加选项（animation/events/persistent 均未传）时直接使用 `to`，避免无谓的对象包装
- **uni API `fail` 回调类型收紧** - `env.d.ts` 中各导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）的 `fail` 回调参数类型从 `unknown` 收紧为 `UniApiCause`

### 修复

- **守卫混用模式警告** - 当守卫同时调用 `next()` 并返回 Promise 时输出警告（`next()` 之后的异步错误会被静默吞掉，开发者应选择其中一种解析模式：`next()` 回调或 `async/await`，不可混用）
- **`syncCurrentRoute` 参数清理** - 移除 `syncRoute()` 内部未使用的 `_from` 参数

## [1.7.0] - 2026-06-25

### 新增

- **守卫重定向方式可控** - `next()` 回调新增可选 `options` 参数，支持在守卫重定向时指定导航方式
  - `NavigationGuardNextOptions` - `next()` 回调的可选参数类型，包含 `mode` 字段
  - `NavigationRedirectMode` - 重定向方式类型（`'push' | 'replace' | 'relaunch'`）
  - `next(location, { mode })` - 重定向时指定使用 `push` / `replace` / `relaunch` 方式
  - 未指定 `mode` 时沿用触发守卫的原始导航方式（向后兼容）
  - 原始导航为 `back` 时，未指定 `mode` 则回退为 `relaunch`（因 `back` 无法跳转到页面栈外目标）

### 修复

- **H5 平台 `interceptUniApi` 导致 TabBar 点击卡死** - 1.6.3 通过调换执行顺序恢复了 switchTab 走守卫链，但 H5 平台下同步阻止 `uni.switchTab` 仍会导致 TabBar 组件内部「切换中」状态无法清除，后续点击被忽略。现对 H5 平台的 switchTab 改用「放行原始调用 + success 回调同步状态」策略
  - 新增 `isWebPlatform()` 检测 H5 平台（通过 `window` / `document` 存在性判断）
  - 新增 `handleWebSwitchTab()` 包装 `success` 回调，在 switchTab 完成后调用 `router.syncRoute()` 同步路由状态
  - 权衡：H5 平台下外部 `uni.switchTab` 调用不再经过前置守卫，TabBar 页面权限控制需在页面 `onShow` 生命周期中处理
  - 小程序平台和 App 平台不受影响，仍走完整的「阻止 + 转发」流程

## [1.6.3] - 2026-06-24

### 修复

- **`interceptUniApi` 导致 H5 端 TabBar 无法点击** - 拦截器 `invoke` 钩子中 `args.url = ''` 在 `handleInterceptedNavigation()` 之前执行，导致 `parseUniUrl('')` 返回空路径，`switchTab` 导航被吞掉。H5 端 TabBar 是 Vue 组件，点击时调用 `uni.switchTab` 触发拦截器后 URL 被提前清空；小程序端 TabBar 是原生组件，点击不经过 `uni.switchTab`，故不受影响。现已调换执行顺序，先解析 URL 并触发路由器导航，再清空 URL 作为双重保险，同时恢复 `switchTab` 走守卫链

## [1.6.2] - 2026-06-23

### 修复

- **`isReady()` 执行时机修正** - `markReady()` 从 `setCurrentRoute()` 移到 `install()` 方法中，确保 `isReady()` 回调在所有插件（如 Pinia）安装完成后执行，而非在 `createRouter()` 构造时立即触发

## [1.6.1] - 2026-06-23

### 优化

- **`isSameQuery` 空对象快速路径** - 添加引用相等（`a === b`）和双空对象（`keysA.length === 0`）快速返回，避免高频调用场景下不必要的 `Object.keys` 和 `every` 开销
- **`Object.freeze` 逻辑集中化** - 将 `meta`、`query`、`params` 的冻结逻辑从 `setCurrentRoute` 和 `createStartLocation` 集中到 `createRouteLocation` 工厂函数中，消除重复代码，后续条件冻结只需改一处

## [1.6.0] - 2026-06-23

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

## [1.5.0] - 2026-06-18

### 新增

- **路由器就绪超时保护** - `readyTimeout` 配置项，防止路由器初始化异常时 `isReady()` Promise 永久挂起
  - `RouterOptions.readyTimeout` - 路由器就绪超时时间（毫秒），默认 `0`（永不超时），设为大于 0 时超时后 `isReady()` 将 reject
  - `router.isReady()` 超时 reject - 当配置了 `readyTimeout > 0` 且路由器在指定时间内未完成初始化时，`await router.isReady()` 将抛出超时错误

### 修复

- **`interceptUniApi` 拦截列表文档遗漏 `reLaunch`** - v1.0.0 文档仅列出 `navigateTo` / `redirectTo` / `switchTab` / `navigateBack` 四个 API，实际实现（含 v1.3.0 新增）拦截五个 API，已补充 `reLaunch` 到文档说明
- **`RouteMeta` 索引签名类型修正** - `[key: string]` 类型从 `unknown` 修正为 `any`，与实际实现保持一致
- **`router.back()` 返回值文档修正** - 返回值类型从 `Promise<void>` 修正为 `Promise<RouteLocation>`，与实际实现保持一致

## [1.4.0] - 2026-06-14

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

## [1.3.0] - 2026-06-12

### 新增

- **relaunch 导航方式** - `router.relaunch(location)` 关闭所有页面并打开目标页面，对应 `uni.reLaunch`
  - TabBar 页面自动切换为 `uni.switchTab`
  - `uni.reLaunch` 不支持动画参数，传入时输出警告
  - 不进行重复导航检测（清栈场景下目标页面可能就是当前页面）
  - 走完整守卫链（beforeEach → beforeEnter → beforeResolve → afterEach）
- **RouterLink `relaunch` prop** - 声明式导航支持 relaunch 模式，优先级高于 `replace`
- **uni API 拦截器新增 `reLaunch`** - 拦截 `uni.reLaunch` 调用，转发到 `router.relaunch()`

## [1.2.0] - 2026-06-11

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

## [1.1.2] - 2026-06-10

### 修复

- **`getCurrentPages()` 环境保护** - 新增 `safeGetCurrentPages()` 函数，在 SSR / Node 环境下 `getCurrentPages` 不存在时返回空数组，避免 `ReferenceError`
- **拦截器 `invoke` 低版本基础库兼容** - 拦截外部导航调用时先将 `args.url` 置为空字符串，防止低版本小程序基础库忽略返回值 `false` 而继续执行原始 API
- **拦截器重复安装警告** - `installInterceptors` 中检测到已有活跃管理器时输出 `console.warn`，提醒只支持单路由器实例

## [1.1.1] - 2026-06-09

### 修复

- **`back()` 未触发 `afterEach` 守卫** - `router.back()` 导航完成后未执行 `afterEach` 后置钩子，现已修复
- **`back()` 守卫模式错误** - `back()` 导航的守卫模式从 `'push'` 修正为 `'back'`，确保守卫链正确识别返回导航
- **`syncRoute()` 忽略 query 变化** - `syncRoute()` 仅比较路径未比较查询参数，导致 query 变化时路由状态不同步，现已同时比较 path 和 query
- **`app.onUnmount` 兼容性** - `install` 中直接调用 `app.onUnmount` 在 uni-app 环境下报错（该 API 为 Vue 3.5+ 新增），已添加防御性检查

## [1.1.0] - 2026-06-08

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

## [1.0.0] - 2026-06-07

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

## [0.1.4] - 2025-07-28

- 新增 Hooks 函数 `useMxRouter`
- 新增组件 `Router`
- 类 `Router` 中的 `push`、`back` 和 `go` 等函数在 app 平台支持动画
- 优化 md 文档描述

## [0.1.3] - 2025-07-24

- 新增 `umd.js` 文件
- `MxRouter` 类改名为 `Router` 类
- `Router` 类内部支持单例模式调用
- `Router` 类新增 `customGetCurrentRoute` 参数、`setCustomGetCurrentRoute` 函数，设置自定义的 `getCurrentRoute` 函数

## [0.1.1] - 2025-07-20

- 调整目录结构及 vite.config 配置，修改 md 文件内容与 npm 包对应

## [0.1.0] - 2025-07-19

> 首个版本。`@mengxi/uni-router` 是一款为 uni-app 量身打造的路由库，提供与 `vue-router` 高度相似的路由风格，同时附带实用工具函数，助力开发者高效实现多平台路由管理。

- **类 `vue-router` 风格** - 熟悉的 API 设计，降低学习成本，让 `vue-router` 用户快速上手
- **多导航方法** - 支持 `push`、`replace`、`launch`、`tab`、`go`、`back` 等导航方式，满足不同场景跳转需求
- **全局守卫机制** - 前置守卫（权限验证、路由拦截）、后置钩子（日志记录、页面统计）
- **工具函数** - 提供 `parseLocation`、`buildUrl`、`getCurrentRoute` 等工具，简化路由操作
- **多平台支持** - 适配 H5、小程序、App 等 uni-app 支持的平台

---

历史版本见 [Releases](https://github.com/MengXi-Studio/uni-router/releases)。