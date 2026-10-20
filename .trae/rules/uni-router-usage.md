# uni-router 路由使用规则

本项目所有页面导航、路由配置与守卫逻辑必须严格基于 `@meng-xi/uni-router`（uni_module 版本为 `mxuni-router-v2`，下文统称 uni-router）实现，不得绕过或偏离其路由体系。

## 适用范围

此规则适用于以下所有开发环节：

- 页面创建与 `pages.json` / 路由配置维护
- 页面跳转、返回、重定向等导航逻辑编写
- 页面间数据传递与通信
- 导航动画与自定义 TabBar
- 路由守卫（登录鉴权、返回拦截、冷启动鉴权）设计

## 核心要求

1. **必须通过 Router 实例导航**：所有跳转使用 `router.push` / `replace` / `relaunch` / `back`，禁止直接调用 `uni.navigateTo` / `uni.redirectTo` / `uni.reLaunch` / `uni.switchTab` / `uni.navigateBack`；建议开启 `interceptUniApi: true`，让遗漏的原生调用也被转由路由器处理。

2. **路由配置与 pages.json 保持一致**：`createRouter` 的 `routes` 中 `path` 必须与 `pages.json` 页面声明完全一致（不带前导 `/`）；`meta.isTab` 必须与 `pages.json` 的 `tabBar.list` 一致，不一致会导致导航行为异常。

3. **必须执行 `app.use(router)`**：注入全局 mixin 后页面 `onShow` 自动 `syncRoute()`，禁止在页面中手动维护路由状态同步。

4. **插件按需注册**：`params` 传参需 `ParamsPlugin`、导航动画需 `AnimationPlugin`、`events` 页面通信需 `ChannelPlugin`、拦截原生 API 需 `InterceptorPlugin`；未注册对应插件时使用相关功能会抛出 `PLUGIN_REQUIRED`，不得假设功能默认可用。

5. **TabBar 页面传参限制**：`meta.isTab: true` 的页面禁止通过 `query` 或 `params` 传参（`uni.switchTab` 不支持 URL 参数，会被静默忽略）；TabBar 页面间数据传递使用全局状态（Pinia/Vuex）或 storage。

6. **遵守平台硬限制**：小程序页面栈上限 10 层（接近上限时改用 `relaunch` 重置或 `replace` 替换）；`relaunch` 全平台不支持动画；H5 端无法真正清空浏览器历史栈，且禁止在业务代码中手动调用 `history.back()` / `history.pushState()` 等 API 操作历史栈。

7. **横切逻辑收敛到守卫**：登录鉴权、未保存离开提示等逻辑一律通过守卫实现（`beforeEach` 全局鉴权、`onBeforeBack` 返回拦截、App.vue `onLaunch` 中 `guardRoute()` 冷启动补鉴权），禁止散落在各页面代码中重复实现。

8. **错误处理**：导航调用使用 `try/catch` 捕获 `NavigationFailure`，通过 `isNavigationFailure(error, RouterErrorCode.XXX)` 精准判断错误类型，不得忽略导航失败。

9. **分享链接数据走 query**：H5 端可被分享 / 直达的页面，其数据必须通过 `query` 传参（URL 携带，任何设备可读）；禁止用 `params` 作为分享数据载体（params 存于本机内存 / storage，不随链接传播，跨设备打开必丢失）。

## 详细规范

编写路由相关代码前，先阅读技能文档：`.trae/skills/uni-router-usage/SKILL.md`，其中包含四大导航方法差异表与 TabBar 切换细节、query/params 传参规范、events 通信两种模式（含目标页接收方式）、导航动画平台差异、守卫链顺序、H5 端限制与解决方案、冷启动恢复完整示例、分享链接与 params 恢复方案、错误码表及完整禁止清单。
