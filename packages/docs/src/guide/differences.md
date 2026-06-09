# 与 vue-router 的差异

Uni Router 参考了 vue-router 的 API 设计，但由于 uni-app 框架的特殊性，两者存在重要差异。

## 设计理念

|          | vue-router           | Uni Router                |
| -------- | -------------------- | ------------------------- |
| 页面模型 | 动态路由，组件级渲染 | 静态页面，pages.json 声明 |
| 导航方式 | 操作浏览器 History   | 调用 uni 原生导航 API     |
| 视图渲染 | `<router-view>` 组件 | uni-app 页面栈            |
| 路由注册 | 运行时动态注册       | 编译时 pages.json 确定    |

## API 差异对比

### 支持的 API

| vue-router API           | Uni Router                  | 说明                            |
| ------------------------ | --------------------------- | ------------------------------- |
| `router.push()`          | ✅ `router.push()`          | 自动选择 navigateTo / switchTab |
| `router.replace()`       | ✅ `router.replace()`       | 自动选择 redirectTo / switchTab |
| `router.back()`          | ✅ `router.back(delta?)`    | 支持 delta 参数                 |
| `router.beforeEach()`    | ✅ `router.beforeEach()`    | 行为一致                        |
| `router.beforeResolve()` | ✅ `router.beforeResolve()` | 行为一致                        |
| `router.afterEach()`     | ✅ `router.afterEach()`     | 行为一致                        |
| `router.currentRoute`    | ✅ `router.currentRoute`    | 只读                            |
| `router.resolve()`       | ✅ `router.resolve()`       | 行为一致                        |
| `router.isReady()`       | ✅ `router.isReady()`       | 行为一致                        |
| `router.onError()`       | ✅ `router.onError()`       | 行为一致                        |
| `router.hasRoute()`      | ✅ `router.hasRoute()`      | 仅检查名称                      |
| `router.getRoutes()`     | ✅ `router.getRoutes()`     | 返回配置浅拷贝                  |
| `useRouter()`            | ✅ `useRouter()`            | 行为一致                        |
| `useRoute()`             | ✅ `useRoute()`             | 返回响应式 `Ref<RouteLocation>`  |

### 不支持的 API

| vue-router API              | 原因                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| `router.go(n)`              | 小程序不支持前进导航                                                       |
| `router.forward()`          | 小程序不支持前进导航                                                       |
| `router.addRoute()`         | uni-app 页面由 pages.json 静态声明                                         |
| `router.removeRoute()`      | 同上                                                                       |
| `router.getRoutes()` 的修改 | 路由配置不可动态变更                                                       |
| `<router-view>`             | uni-app 有自己的页面渲染机制                                               |
| `<router-link>`             | 支持简化版 [RouterLink](/api/router-link) 组件，仅支持路径字符串和 replace |
| 嵌套路由                    | uni-app 无嵌套视图                                                         |
| 命名视图                    | uni-app 无多视图支持                                                       |
| 路由懒加载                  | uni-app 有自己的代码分割                                                   |
| 路由别名                    | uni-app 页面路径固定                                                       |
| 正则路径                    | uni-app 页面路径固定                                                       |
| History 模式选择            | uni-app 各端使用不同的路由模式                                             |

## 导航行为差异

### TabBar 页面

vue-router 中 TabBar 页面与普通页面导航方式相同。Uni Router 中需要根据 `meta.isTab` 自动选择不同的 uni API：

```ts
// vue-router：统一使用 push
router.push('/user')

// Uni Router：根据 isTab 自动选择
// isTab: true → uni.switchTab
// isTab: false → uni.navigateTo
router.push({ name: 'user' })
```

### 页面栈

vue-router 操作浏览器 History 栈。Uni Router 操作 uni-app 页面栈：

- `push()` → 页面入栈
- `replace()` → 替换栈顶页面
- `back()` → 页面出栈

### replace 到 TabBar 页面

vue-router 中 replace 仅替换当前路由记录。Uni Router 中 replace 到 TabBar 页面会关闭所有非 Tab 页面（由 `uni.switchTab` 行为决定）。

## 守卫差异

### next() 行为

两者的 `next()` 行为基本一致，但 Uni Router 的重定向深度限制为 10 次。

### 错误处理

vue-router 4.x 中守卫抛出错误会导致导航失败。Uni Router 行为一致，守卫异常会被视为 `NAVIGATION_CANCELLED`。

## 迁移建议

如果你从 vue-router 迁移到 Uni Router：

1. **移除 `<router-view>`**：uni-app 不需要此组件
2. **替换 `<router-link>`**：使用简化版 [RouterLink](/api/router-link) 组件替代，注意仅支持路径字符串
3. **移除 `router.go()` 和 `router.forward()`**：使用 `router.back()` 替代
4. **移除动态路由注册**：所有页面必须在 `pages.json` 中声明
5. **为 TabBar 页面设置 `isTab: true`**：确保使用正确的导航 API
6. **调整 replace 到 TabBar 页面的逻辑**：注意 `switchTab` 会关闭所有非 Tab 页面
7. **移除嵌套路由和命名视图**：uni-app 不支持
