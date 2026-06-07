## 0.2.0（2026-06-07）

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
