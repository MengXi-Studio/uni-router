# uni-router API 速查

本文为 SKILL.md 的细节补充，需要完整选项、类型清单、注意事项时按需读取。所有内容基于 core 源码核实。

## createRouter 选项完整表

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `routes` | `RouteConfig[]` | - | 路由配置，需与 `pages.json` 一致 |
| `strict` | `boolean` | `true` | 未匹配的命名路由抛出异常 |
| `guardTimeout` | `number` | `10000` | 守卫超时（ms），超时警告并自动中止导航，`0` 关闭 |
| `readyTimeout` | `number` | `0` | `isReady()` 就绪超时（ms），`0` 表示永不超时 |
| `plugins` | `RouterPlugin[]` | `[]` | 按需注册插件，数组顺序即安装顺序 |
| `paramsPersistent` | `boolean` | `false` | params 默认持久化到 storage（需 ParamsPlugin） |
| `useUniEventChannel` | `boolean` | `false` | 所有导航方式均支持页面通信（需 ChannelPlugin） |
| `interceptUniApi` | `boolean` | `false` | 拦截 uni 原生导航 API（需 InterceptorPlugin） |
| `app` | `AppRouterOptions` | - | App 专属，如 `setSideSlipGesture(to)` 控制 iOS 侧滑返回（`'none'` 禁用 / `'close'` 保留） |

## RouteMeta 常用字段

`title`（页面标题）、`isTab`（是否 TabBar 页，必须与 `pages.json` 的 `tabBar.list` 一致）、`requireAuth`（需登录，常配合 `beforeEach` 鉴权）、`animation`（默认导航动画，可被调用时传入覆盖）；支持任意自定义扩展字段（如 `requireConfirm`）。

## UniAnimationType 全部 18 值

`auto` / `none` / `slide-in-right` / `slide-in-left` / `slide-in-top` / `slide-in-bottom` / `slide-out-right` / `slide-out-left` / `slide-out-top` / `slide-out-bottom` / `fade-in` / `fade-out` / `zoom-out` / `zoom-in` / `zoom-fade-out` / `zoom-fade-in` / `pop-in` / `pop-out`

- 入栈动画（push）用 `*-in` 系（含 `zoom-out` / `zoom-fade-out`）；出栈动画（back）用 `*-out` 系（含 `zoom-in` / `zoom-fade-in`）
- `NavigationAnimation` 格式：`{ type: UniAnimationType, duration?: number }`，`duration` 默认 300

## Router 实例方法速查

```typescript
router.push(location)                 // Promise<NavigationResult>
router.replace(location)              // Promise<NavigationResult>
router.relaunch(location)             // Promise<NavigationResult>
router.back(delta?, options?)         // Promise<RouteLocation>
router.resolve(location)              // 仅解析不导航
router.getRoutes()                    // 路由配置列表
router.hasRoute(name)                 // 是否存在命名路由
router.isReady()                      // Promise<void>，就绪后 resolve
router.guardRoute(location?, options?) // 冷启动补执行守卫链（见 h5-guide.md）
router.onError(handler)               // 全局导航错误兜底
router.onRouteChange(handler)         // 订阅路由状态变化（含状态同步）
router.onBeforeBack(handler)          // 注册返回守卫
router.hasPlugin('params' | 'animation' | 'channel' | 'interceptor')
router.syncRoute()                    // 手动同步路由状态（app.use 后通常无需调用）
```

## usePageChannel 注意事项

- 必须在组件 `setup()` 中调用，外部调用抛 `SETUP_ERROR`
- 通过 `route.params.__navId` 关联导航方创建的通道（同一 navId 复用实例）
- 页面卸载时自动销毁通道并清理所有监听器，防止内存泄漏
- 无 `__navId`（非通道导航进入）或未开启 `useUniEventChannel` 时返回 no-op 通道，调用方无需判空

## query 增强读取

```typescript
const route = useRoute()
route.query.id             // '1'（string）
route.queryInt('id')       // 1
route.queryNumber('price') // 支持浮点
route.queryBool('enabled') // 'true'/'1' → true，'false'/'0' → false
```

## RouteLocation / NavigationResult 关键字段

`path` / `fullPath` / `name` / `query` / `params` / `meta` / `_synced`（是否来自状态同步而非完整导航）；`NavigationResult` 继承 `RouteLocation`，额外含 `eventChannel`（默认仅 `push` 返回）。

## 高级导出（常规业务一般用不到）

- `UniEventChannel`：页面通信通道类（`usePageChannel()` 的返回类型，基于 `uni.$emit` / `uni.$on`）；`noopChannel`：no-op 通道实例（未开启通道模式时兜底返回）
- `RouterError` / `NavigationFailure` / `UniApiError`：错误类；`NavigationFailure.cause`（含 `UniApiCause`）携带底层 uni API 原始错误
- 自定义插件：实现 `RouterPlugin` 接口后加入 `createRouter` 的 `plugins` 数组即可（涉及 `PluginContext` / `NavigationPrepareContext` / `NavigationCompleteContext`，参考内置四插件源码编写）
- `DEFAULT_ANIMATION_DURATION`：动画默认时长常量（300ms）；`ROUTER_SYMBOL`：内部依赖注入标识
