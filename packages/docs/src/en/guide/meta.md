# Route Meta

Route meta (RouteMeta) is used to attach custom properties to routes, such as page title, permission requirements, TabBar identification, etc.

## RouteMeta Interface

```ts
interface RouteMeta {
  title?: string
  isTab?: boolean
  requireAuth?: boolean
  animation?: NavigationAnimation
  [key: string]: unknown
}
```

## Built-in Fields

### title

Page title, can be used in `afterEach` hooks to dynamically set the navigation bar title:

```ts
const routes = [
  { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } },
  { path: 'pages/about/about', name: 'about', meta: { title: 'About Us' } }
]

router.afterEach((to) => {
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

### isTab

Identifies whether the page is a TabBar page. The router automatically selects the navigation API based on this field:

- `isTab: true` → `uni.switchTab`
- `isTab: false` or not set → `uni.navigateTo` / `uni.redirectTo`

```ts
const routes = [
  { path: 'pages/user/user', name: 'user', meta: { isTab: true } }
]

// Automatically uses uni.switchTab
router.push({ name: 'user' })
```

::: warning
`isTab` must be consistent with the `tabBar.list` declaration in `pages.json`. If a page is a TabBar page but `isTab: true` is not set, navigation will use `uni.navigateTo` instead of `uni.switchTab`, causing navigation failure.
:::

### requireAuth

Identifies whether the page requires login authentication, commonly used with route guards:

```ts
const routes = [
  { path: 'pages/profile/profile', name: 'profile', meta: { requireAuth: true } }
]

router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

### animation

Default navigation animation (App only), can be overridden by the `animation` parameter passed to `push` / `replace` / `back`:

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // default 300ms
}
```

Animation priority: `inline param` > `meta.animation` > `uni default`

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]
```

::: info
Animation types correspond to uni-app's `animationType` parameter. See [Navigation Animation](./navigation#navigation-animation) for details.
:::

## Custom Extension Fields

`RouteMeta` supports adding arbitrary custom fields through index signatures:

```ts
const routes = [
  {
    path: 'pages/article/article',
    name: 'article',
    meta: {
      title: 'Article Detail',
      requireAuth: false,
      keepAlive: true,
      pageType: 'content',
      permissions: ['read', 'comment']
    }
  }
]
```

Access custom fields in guards:

```ts
router.beforeEach((to, from, next) => {
  const permissions = to.meta.permissions as string[] | undefined
  if (permissions && !hasPermissions(permissions)) {
    next(false)
  } else {
    next()
  }
})
```

::: tip
Type assertions are needed when accessing custom fields because the index signature value is `unknown` type.
:::

## Accessing Meta

### In Components

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
console.log(route.meta.title)
console.log(route.meta.isTab)
```

### In Guards

```ts
router.beforeEach((to, from, next) => {
  console.log(to.meta.requireAuth)
  next()
})
```

### Via Router Instance

```ts
router.currentRoute.meta.title
```
