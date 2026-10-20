# 排错矩阵（症状 → 原因 → 修复）

按**看到的现象**检索。每条都给出最短修复路径，细节回溯 `guide/faq.md` 对应章节。
先确认：这些是 uni-app 硬限制而非 bug —— 页面栈 10 层、`switchTab` 无 query、`reLaunch` 无动画、
小程序原生返回不可拦截、H5 为 hash 模式、无动态路由、无 `<router-view>`。

## 守卫类

| 症状 | 原因 | 修复 |
| --- | --- | --- |
| `beforeEach` 不执行 | 直接调了 `uni.navigateTo` 绕过路由器 | 改用 `router.push`，或开 `interceptUniApi: true`（需 InterceptorPlugin） |
| 守卫逻辑没走 | 漏 `return`；异步未 `await`（`.then` 里 return） | 所有分支显式 return；用 `async/await` |
| 控制台 `Navigation guard timeout` | 守卫里有耗时请求 > `guardTimeout`（默认 10s） | 调大 `guardTimeout`，或把耗时逻辑挪到页面 `onLoad` |
| 守卫里 `router.push()` 卡死 | 新导航等当前导航，当前守卫等新导航 → 死锁 | 守卫内一律用 `return location` 重定向 |
| 重定向循环 | 重定向深度 > 10 → `NAVIGATION_CANCELLED` | 给重定向加终止条件（如目标页自身放行） |
| 冷启动未鉴权就进页 | H5 URL / 场景值 / deeplink 直达不经过路由器 | `isReady().then(() => router.guardRoute(launchPath, { onAbort }))`；**记住第一个参数是 location** |
| 返回操作拦不住 | 小程序无 `onBackPress`/`popstate`；iOS 侧滑默认绕过 | 小程序改用 `onShow` 事后处理；iOS 配 `app.setSideSlipGesture(() => 'none')` |
| `afterEach` 某些场景不触发 | 物理返回 / 浏览器后退属于状态同步，不走 afterEach | 配 `router.onRouteChange()`，用 `to._synced` 区分 |

## 参数类

| 症状 | 原因 | 修复 |
| --- | --- | --- |
| `route.params` 为空 | H5 刷新丢失 / `relaunch` 清栈 / 未注册 `ParamsPlugin` | 关键参数走 query；复杂对象加 `persistent: true`；注册插件 |
| TabBar 页拿不到 `params`/`query` | `switchTab` 不支持 query，`__params_key` 传不过去 | 用 Pinia + `onShow`（见 `patterns.md` #7） |
| `switchTab` 后 query 丢失 | uni-app 硬限制 | 同上，或改用全局状态 |
| `back()` 后 params 丢失 | 目标页已被销毁 / key 被清理 | 正常情况 `back()` 会用 `peek` 重建 params；确认不是 `relaunch` 导致栈重建 |
| 读到旧路由 | 在 `onLoad`（早于 `onShow`）读 | 手动 `router.syncRoute()`，或改到 `onShow` 读（mixin 已自动同步） |

## 导航类

| 症状 | 原因 | 修复 |
| --- | --- | --- |
| `NAVIGATION_DUPLICATED` | `push` 到当前位置（path+name+query 相同） | `catch` 后忽略，或改 `replace` |
| `navigateTo:fail limit exceed` | 页面栈满 10 层 | 改 `relaunch`；或 `safePush`（栈 ≥ 8 自动降级） |
| `back()` 抛 `NAVIGATION_CANCELLED` | 栈不足 | `catch` 后 `relaunch({ name: 'home' })` |
| 跳 TabBar 失败 / 跳非 TabBar 失败 | `meta.isTab` 与 `pages.json` 的 `tabBar.list` 不一致 | 用 `generateRouter` 自动生成（会自动标 `isTab`） |
| `ROUTE_NOT_FOUND` | `strict: true` 下路由名不存在 | 校对命名；自动生成项目注意 `nameStrategy` 产出的是 `pagesIndexIndex` 这类名字 |
| 跳转后白屏 | `path` 与 `pages.json` 不一致（多/少前导 `/`、分包路径写错） | 分包要写 `分包根/页面路径`，如 `pages-sub/profile/profile` |
| 动画不生效 | 小程序端宿主控制；`replace`/`relaunch` 无动画；未注册 `AnimationPlugin` | 用条件编译按平台设置；只期望 App / H5 push 生效 |
| `eventChannel` 为 undefined | 默认只有 `push` 有；`redirectTo`/`reLaunch` 不支持原生通道 | 开 `useUniEventChannel: true`（需 ChannelPlugin） |
| `PLUGIN_REQUIRED` | 用了 `params`/`animation`/`events` 但插件未注册 | 注册对应插件；`router.hasPlugin('params')` 可运行时探测 |

## 工程配置类

| 症状 | 原因 | 修复 |
| --- | --- | --- |
| H5 刷新 404 | 用了非 hash URL | 保持 `manifest.json` 的 `h5.router.mode: 'hash'`，或服务器配 `try_files ... /index.html` |
| 警告 `Another router instance has already installed interceptors` | 多个启用了 `interceptUniApi` 的实例 | 路由器保持单例；HMR 时 `import.meta.hot.dispose` 卸载 |
| `SETUP_ERROR` | `useRouter()` 在 setup 外调用，或未 `app.use(router)` | 组件外直接 import 实例；确认 `app.use(router)` |
| `RouteMeta` 扩展不生效 | 声明文件未被 tsconfig 收录，或多处重复声明 | `include` 加 `src/**/*.d.ts`；只保留一处 `declare module` |
| 类型提示没有路由名 | 未开 `dts` | `generateRouter({ dts: true })` 生成 `RouteNameMap` |
| 组件引入报错 | 组件不在包入口导出 | 按 `.vue` 路径引入或配 easycom（见 `component/router-link.md`） |

## 排查顺序建议

1. 先看错误码（7 个，见 `api-surface.md`）定位阶段。
2. 再看是否为平台硬限制（`guide/compatibility.md`）。
3. 仍不明 → 读 `guide/navigation-flow.md` 对照时序，确认是哪一步分支。
