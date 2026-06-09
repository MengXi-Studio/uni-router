# createRouter()

Create a uni-app router instance.

## Type

```ts
function createRouter(options: RouterOptions): Router
```

## Parameters

### options

Router initialization options, type [`RouterOptions`](./type-router-options).

```ts
interface RouterOptions {
  routes: RouteConfig[]
  strict?: boolean
  interceptUniApi?: boolean
  guardTimeout?: number
}
```

#### options.routes

Route configuration list, must be consistent with page declarations in `pages.json`.

#### options.strict

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to enable strict mode. When enabled, unmatched named routes throw `ROUTE_NOT_FOUND` error; when disabled, only a warning is output and the name is used as a path fallback.

#### options.interceptUniApi

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to intercept uni native navigation APIs (`navigateTo` / `redirectTo` / `switchTab` / `navigateBack`). When enabled, direct calls to uni APIs are redirected through the router, ensuring guards are always triggered.

#### options.guardTimeout

- **Type**: `number`
- **Default**: `10000`
- **Description**: Guard timeout in milliseconds. Navigation is automatically aborted on timeout. Set to `0` to disable.

## Return Value

Returns a [`Router`](./router-instance) instance.

## Example

### Basic Usage

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
    { path: 'pages/about/about', name: 'about', meta: { requireAuth: true } },
    { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
  ]
})
```

### Lenient Mode

```ts
const router = createRouter({
  routes,
  strict: false
})
```

### Register to Vue App

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
