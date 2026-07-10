# 与 vue-router 的差异

Uni Router 参考了 vue-router 的 API 设计，但由于 uni-app 框架的特殊性，两者存在重要差异。本章详细对比差异，帮助 vue-router 用户快速上手，并避免迁移陷阱。

## 设计理念差异

| 维度 | vue-router | Uni Router |
| --- | --- | --- |
| 页面模型 | 动态路由，组件级渲染 | 静态页面，`pages.json` 声明 |
| 导航方式 | 操作浏览器 History | 调用 uni 原生导航 API |
| 视图渲染 | `<router-view>` 组件 | uni-app 页面栈 |
| 路由注册 | 运行时动态注册 | 编译时 `pages.json` 确定 |
| 页面栈 | 浏览器 History（无上限） | uni-app 页面栈（小程序上限 10） |
| 跨平台 | 仅 Web | App / H5 / 各小程序 |

### 核心差异解析

#### 1. 页面模型

**vue-router**：单页应用，所有页面在同一个 HTML 中，通过 `<router-view>` 动态渲染组件。

**Uni Router**：每个页面是独立的 uni-app 页面（独立的 `.vue` 文件），由 `pages.json` 静态声明，导航时由 uni-app 框架管理页面栈。

```ts
// vue-router：动态路由匹配
{ path: '/user/:id', component: UserDetail }

// Uni Router：静态路径，参数通过 query 传递
{ path: 'pages/user/detail/detail', name: 'user-detail' }
// 导航：router.push({ name: 'user-detail', query: { id: '123' } })
```

#### 2. 导航方式

**vue-router**：操作浏览器 History API（`pushState` / `replaceState`）。

**Uni Router**：调用 uni 原生导航 API（`navigateTo` / `redirectTo` / `switchTab` / `reLaunch` / `navigateBack`）。

```ts
// vue-router：操作 History
router.push('/about')

// Uni Router：调用 uni.navigateTo
router.push({ name: 'about' })
// 内部执行：uni.navigateTo({ url: '/pages/about/about' })
```

#### 3. 页面栈限制

**vue-router**：浏览器 History 无上限。

**Uni Router**：小程序页面栈上限 10 层，超过后 `navigateTo` 失败。

```ts
// Uni Router 需要考虑页面栈深度
const pages = getCurrentPages()
if (pages.length >= 8) {
  await router.relaunch({ name: 'target' }) // 改用 relaunch
} else {
  await router.push({ name: 'target' })
}
```

## API 对比

### 支持的 API

| vue-router API | Uni Router | 说明 |
| --- | --- | --- |
| `router.push()` | ✅ `router.push()` | 自动选择 navigateTo / switchTab |
| `router.replace()` | ✅ `router.replace()` | 自动选择 redirectTo / switchTab |
| `router.relaunch()` | ❌ → ✅ `router.relaunch()` | Uni Router 独有，对应 reLaunch |
| `router.back()` | ✅ `router.back(delta?)` | 支持 delta 参数 |
| `router.go(n)` | ❌ | 小程序不支持前进导航 |
| `router.forward()` | ❌ | 小程序不支持前进导航 |
| `router.beforeEach()` | ✅ `router.beforeEach()` | 行为一致 |
| `router.beforeResolve()` | ✅ `router.beforeResolve()` | 行为一致 |
| `router.afterEach()` | ✅ `router.afterEach()` | 行为一致 |
| `router.currentRoute` | ✅ `router.currentRoute` | 只读 |
| `router.resolve()` | ✅ `router.resolve()` | 行为一致 |
| `router.isReady()` | ✅ `router.isReady()` | 行为一致 |
| `router.onError()` | ✅ `router.onError()` | 行为一致 |
| `router.hasRoute()` | ✅ `router.hasRoute()` | 仅检查名称 |
| `router.getRoutes()` | ✅ `router.getRoutes()` | 返回配置浅拷贝 |
| `router.addRoute()` | ❌ | uni-app 页面由 pages.json 静态声明 |
| `router.removeRoute()` | ❌ | 同上 |
| `useRouter()` | ✅ `useRouter()` | 行为一致 |
| `useRoute()` | ✅ `useRoute()` | 返回响应式 `Ref<RouteLocation>` |

### 不支持的特性

| vue-router 特性 | 原因 |
| --- | --- |
| `<router-view>` | uni-app 有自己的页面渲染机制 |
| `<router-link>` | 支持简化版 [RouterLink](../component/router-link) 组件，基于 `<navigator>` 封装 |
| 嵌套路由 | uni-app 无嵌套视图 |
| 命名视图 | uni-app 无多视图支持 |
| 路由懒加载 `() => import()` | uni-app 有自己的代码分割（分包） |
| 路由别名 | uni-app 页面路径固定 |
| 正则路径 | uni-app 页面路径固定 |
| 动态路由 `:id` | uni-app 页面路径固定，用 query 传递参数 |
| History 模式选择 | uni-app 各端使用不同的路由模式 |
| `scrollBehavior` | uni-app 各端滚动行为不同 |

## 导航行为差异

### TabBar 页面

**vue-router**：TabBar 页面与普通页面导航方式相同。

**Uni Router**：根据 `meta.isTab` 自动选择不同 API：

```ts
// vue-router：统一使用 push
router.push('/user')

// Uni Router：根据 isTab 自动选择
// isTab: true → uni.switchTab（不支持 query）
// isTab: false → uni.navigateTo（支持 query）
router.push({ name: 'user' })
```

::: warning switchTab 不支持 query
`uni.switchTab` 不支持 query 参数。TabBar 页面间传参需用全局状态。详见[平台兼容性](./compatibility#switchtab-不支持-query)。
:::

### 页面栈操作

**vue-router**：操作浏览器 History 栈。

**Uni Router**：操作 uni-app 页面栈：

| 操作 | vue-router | Uni Router | uni API |
| --- | --- | --- | --- |
| 入栈 | `router.push()` | `router.push()` | `navigateTo` |
| 替换栈顶 | `router.replace()` | `router.replace()` | `redirectTo` |
| 清空栈 | - | `router.relaunch()` | `reLaunch` |
| 出栈 | `router.back()` | `router.back()` | `navigateBack` |
| 前进 | `router.forward()` | ❌ | - |
| 指定步数 | `router.go(n)` | `router.back(delta)` | `navigateBack({ delta })` |

### replace 到 TabBar 页面

**vue-router**：`replace` 仅替换当前路由记录。

**Uni Router**：`replace` 到 TabBar 页面会关闭所有非 Tab 页面（由 `uni.switchTab` 行为决定）。

```ts
// 当前栈：[home, list, detail]
await router.replace({ name: 'user' }) // user 是 TabBar 页面
// 栈变为：[home, user]（list 和 detail 被关闭）
```

## 守卫差异

### next() 行为

两者的 `next()` 行为基本一致，但 Uni Router 有以下扩展：

```ts
// vue-router
next()                    // 放行
next(false)               // 中止
next('/path')             // 重定向
next({ name: 'route' })   // 重定向

// Uni Router（v1.7.0+）
next()                                          // 放行
next(false)                                     // 中止
next('/path')                                   // 重定向（默认 push）
next({ name: 'route' })                         // 重定向（默认 push）
next({ name: 'route' }, { mode: 'replace' })    // 重定向（指定方式）
next({ name: 'route' }, { mode: 'relaunch' })   // 重定向（清空栈）
```

### 重定向深度限制

**vue-router**：无明确限制。

**Uni Router**：重定向深度限制为 10 次，防止无限循环。

### 守卫超时

**vue-router**：无超时机制。

**Uni Router**：有 `guardTimeout` 选项（默认 10 秒），超时后导航取消。

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 秒
})
```

## 数据传递差异

### params

**vue-router**：params 通过 URL 或内存传递，刷新后可能丢失（取决于模式）。

**Uni Router**：params 通过内存 + URL key 传递，H5 刷新后丢失。

```ts
// vue-router
router.push({ name: 'user', params: { id: 123 } })

// Uni Router
router.push({ name: 'user', params: { user: complexObject } })
// 内部：生成 key，存入内存，URL 带 ?__params_key=xxx
```

### query

**vue-router**：所有导航方式都支持 query。

**Uni Router**：`switchTab` 不支持 query，TabBar 页面间传参需用全局状态。

## 迁移指南

### 1. 移除不支持的特性

```ts
// ❌ 移除动态路由
{ path: '/user/:id', component: UserDetail }

// ✅ 改为静态路径 + query
{ path: 'pages/user/detail/detail', name: 'user-detail' }
// 导航：router.push({ name: 'user-detail', query: { id: '123' } })
```

```ts
// ❌ 移除路由懒加载
{ path: '/about', component: () => import('./About.vue') }

// ✅ 在 pages.json 中声明页面
{ "path": "pages/about/about" }
```

```ts
// ❌ 移除嵌套路由
{
  path: '/user',
  component: UserLayout,
  children: [
    { path: 'profile', component: UserProfile }
  ]
}

// ✅ 改为独立页面
{ path: 'pages/user/profile/profile', name: 'user-profile' }
```

### 2. 替换组件

```vue
<!-- ❌ 移除 router-view -->
<router-view />

<!-- ✅ uni-app 自动渲染页面，无需 router-view -->
```

```vue
<!-- ❌ vue-router 的 router-link -->
<router-link to="/about">关于</router-link>

<!-- ✅ Uni Router 的 RouterLink -->
<RouterLink to="pages/about/about">关于</RouterLink>
<!-- 或用命名路由 -->
<RouterLink :to="{ name: 'about' }">关于</RouterLink>
```

### 3. 调整导航方式

```ts
// ❌ 移除 router.go() 和 router.forward()
router.go(2)
router.forward()

// ✅ 使用 router.back()
router.back(2) // 返回 2 层
```

```ts
// ❌ 移除动态路由注册
router.addRoute({ path: '/dynamic', component: Dynamic })

// ✅ 所有页面在 pages.json 中静态声明
```

### 4. 为 TabBar 页面设置 isTab

```ts
// ❌ vue-router 无需区分
{ path: '/user', component: User }

// ✅ Uni Router 需要标记 isTab
{ path: 'pages/user/user', name: 'user', meta: { isTab: true } }
```

### 5. 处理页面栈限制

```ts
// vue-router：无需考虑栈深度
router.push('/page11')

// Uni Router：小程序栈上限 10，需处理
async function safePush(location) {
  const pages = getCurrentPages()
  if (pages.length >= 8) {
    await router.relaunch(location)
  } else {
    await router.push(location)
  }
}
```

### 6. 调整 replace 到 TabBar 的逻辑

```ts
// vue-router：replace 仅替换当前记录
router.replace('/user')

// Uni Router：replace 到 TabBar 会关闭所有非 Tab 页
// 如果不希望关闭其他页面，改用 push
await router.push({ name: 'user' })
```

### 7. 处理 params 刷新丢失

```ts
// vue-router：params 可能在刷新后保留（取决于模式）
router.push({ name: 'user', params: { id: 123 } })

// Uni Router：params 在 H5 刷新后丢失
// 关键参数用 query，复杂数据用 params
router.push({
  name: 'user',
  query: { id: '123' },        // 关键参数，刷新不丢失
  params: { detail: largeObj } // 复杂数据，刷新丢失
})
```

## 迁移检查清单

- [ ] 移除 `<router-view>` 组件
- [ ] 替换 `<router-link>` 为 `RouterLink`
- [ ] 移除动态路由 `:id`，改用 query
- [ ] 移除路由懒加载 `() => import()`
- [ ] 移除嵌套路由和命名视图
- [ ] 移除 `router.go()` 和 `router.forward()`
- [ ] 移除 `router.addRoute()` 和 `router.removeRoute()`
- [ ] 为 TabBar 页面设置 `meta.isTab: true`
- [ ] 确保路由 `path` 与 `pages.json` 一致
- [ ] 处理页面栈深度（小程序上限 10）
- [ ] 调整 replace 到 TabBar 的逻辑
- [ ] 关键参数改用 query（params 刷新丢失）
- [ ] 添加 `interceptUniApi: true` 拦截原生 API

## 下一步

- [快速开始](./getting-started) — 从零开始集成
- [路由配置](./route-config) — 路由配置详解
- [平台兼容性](./compatibility) — uni-app 限制
