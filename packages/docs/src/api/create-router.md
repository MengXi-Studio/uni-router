# createRouter()

创建 uni-app 路由器实例。

## 类型

```ts
function createRouter(options: RouterOptions): Router
```

## 参数

### options

路由器初始化选项，类型为 [`RouterOptions`](./type-router-options)。

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
}
```

#### options.routes

路由配置列表，需与 `pages.json` 中的页面声明保持一致。

#### options.strict

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用严格模式。启用后，未匹配的命名路由将抛出 `ROUTE_NOT_FOUND` 错误；关闭后仅输出警告并回退到名称作为路径。

## 返回值

返回 [`Router`](./router-instance) 实例。

## 示例

### 基本用法

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
    { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
  ]
})
```

### 宽松模式

```ts
const router = createRouter({
  routes,
  strict: false
})
```

### 注册到 Vue 应用

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  return { app }
}
```
