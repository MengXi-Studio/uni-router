# RouterLink

Navigation component that triggers route navigation on click. Built on uni-app's `<navigator>` component with native touch feedback support.

## Import

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info Direct .vue file import
`RouterLink` is a standalone Vue component file. You need to import the `.vue` file path directly, not from the package entry. It's recommended to configure auto-import in `pages.json`'s `easycom`, or register it globally in `main.ts`.
:::

### Global Registration (Recommended)

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  app.component('RouterLink', RouterLink) // Global registration
  return { app }
}
```

After registration, you can use `<RouterLink>` directly in any component without importing each time.

## Props

### to

- **Type**: `RouteLocationRaw`
- **Required**: Yes
- **Description**: Target route location, supports the following forms:
  - Path string: `'pages/about/about'`
  - Path object: `{ path: 'pages/about/about', query: { id: '1' } }`
  - Named object: `{ name: 'about', query: { id: '1' } }`

```vue
<!-- Path string -->
<RouterLink to="pages/about/about">About</RouterLink>

<!-- Path object (requires :to binding) -->
<RouterLink :to="{ path: 'pages/about/about', query: { id: '1' } }">Details</RouterLink>

<!-- Named route (recommended) -->
<RouterLink :to="{ name: 'about', query: { id: '1' } }">Details</RouterLink>
```

::: warning Object form requires :to binding
When passing an object to the `to` prop, use `:to` binding (`v-bind:to`), not the string attribute `to`. The string form `to="pages/about/about"` can be used directly.
:::

### replace

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use replace mode for navigation
  - `false` → calls `router.push(to)`
  - `true` → calls `router.replace(to)`

```vue
<!-- Navigate from login page, avoid leaving login page in stack -->
<RouterLink to="pages/home/home" replace>
  <text>Login</text>
</RouterLink>
```

### relaunch

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use relaunch mode for navigation (close all pages and open target page)
  - `true` → calls `router.relaunch(to)`
  - Takes priority over `replace`; when both `relaunch` and `replace` are set, `relaunch` is used

```vue
<!-- Logout, clear stack -->
<RouterLink to="pages/login/login" relaunch>
  <text>Logout</text>
</RouterLink>

<!-- Return to home from a deep page -->
<RouterLink to="pages/index/index" relaunch>
  <text>Back to Home</text>
</RouterLink>
```

### animation

- **Type**: `NavigationAnimation | undefined`
- **Default**: `undefined`
- **Description**: Navigation animation (App only), overrides `meta.animation`. Falls back to the target route's `meta.animation` when not specified

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // default 300ms
}
```

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom' }">
  <text>Slide In Bottom</text>
</RouterLink>

<RouterLink to="pages/about/about" :animation="{ type: 'fade-in', duration: 500 }">
  <text>Fade In (500ms)</text>
</RouterLink>
```

::: warning Platform limitations
Animation **only works on App**. Navigation animations on mini-programs and H5 are system-controlled and cannot be customized. `relaunch` does not support animation even on App.
:::

### events

- **Type**: `EventListeners | undefined`
- **Default**: `undefined`
- **Description**: Page communication event listeners (only effective in push mode), corresponding to the `events` parameter of `uni.navigateTo`, used to listen for events sent by the target page via `eventChannel.emit`. Other navigation modes (`replace` / `relaunch`) do not support `events`; they will be ignored when provided.

```ts
type EventListeners = Record<string, (...args: any[]) => void>
```

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: (data) => console.log('Received update:', data) }"
  @navigated="onNavigated"
>
  <text>View Details</text>
</RouterLink>
```

### params

- **Type**: `ParamObject | undefined`
- **Default**: `undefined`
- **Description**: Page parameters, supports passing complex data (objects, arrays, and other JSON-serializable values) without exposing in the URL. Stored via internal Map, target page reads via `route.params`.

```vue
<!-- Pass simple data -->
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123 }">
  <text>View Details</text>
</RouterLink>

<!-- Pass complex data -->
<RouterLink
  :to="{ path: 'pages/detail/detail' }"
  :params="{ id: 123, info: { name: 'Tom', age: 20 }, tags: ['a', 'b'] }"
>
  <text>View Details</text>
</RouterLink>
```

::: tip params vs query
- `query`: Appended to URL, supports strings only, suitable for simple params (e.g., id, page)
- `params`: In-memory storage, supports complex data, not exposed in URL, suitable for large objects

TabBar pages can only use `params` (`switchTab` does not support query).
:::

### persistent

- **Type**: `boolean | undefined`
- **Default**: `undefined`
- **Description**: Whether to persist page parameters to storage. When set to `true`, parameters are persisted via `uni.setStorageSync`, readable after H5 refresh. Falls back to `RouterOptions.paramsPersistent` default when not specified.

```vue
<!-- Persist per navigation -->
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123 }" persistent>
  <text>View Details (survives H5 refresh)</text>
</RouterLink>
```

### hoverClass

- **Type**: `string`
- **Default**: `'navigator-hover'`
- **Description**: Style class applied when pressed, corresponds to `<navigator>`'s `hover-class` attribute. Set to `'none'` to disable hover effect

### hoverStopPropagation

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to prevent ancestor nodes from showing hover effect

### hoverStartTime

- **Type**: `number`
- **Default**: `50`
- **Description**: Duration after press before hover effect appears, in ms

### hoverStayTime

- **Type**: `number`
- **Default**: `600`
- **Description**: Duration hover effect remains after release, in ms

## Events

### error

- **Parameter**: `(error: NavigationFailure)`
- **Description**: Emitted when navigation fails, e.g., guard abort, duplicate navigation, etc. When not listened to, errors are silently handled without causing Unhandled Promise Rejection.

```vue
<RouterLink to="pages/about/about" @error="onNavError">
  <text>About Us</text>
</RouterLink>
```

```ts
import { NavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

function onNavError(error: NavigationFailure) {
  switch (error.code) {
    case RouterErrorCode.NAVIGATION_ABORTED:
      console.log('Navigation aborted by guard')
      break
    case RouterErrorCode.NAVIGATION_DUPLICATED:
      console.log('Already on this page')
      break
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: 'Navigation failed', icon: 'none' })
      console.error('Original error:', error.cause)
      break
  }
}
```

::: tip Recommend listening to the error event
When the `error` event is not listened to, navigation failures are silently handled (no unhandled Promise rejection). However, it's recommended to listen and handle errors in production to improve user experience.
:::

### navigated

- **Parameter**: `(eventChannel: EventChannel | undefined)`
- **Description**: Emitted after a successful `push` navigation, returns `eventChannel` for page communication. `eventChannel` is only available in `push` mode; `replace` / `relaunch` do not trigger this event.

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: (data) => console.log('Received update:', data) }"
  @navigated="onNavigated"
>
  <text>View Details</text>
</RouterLink>
```

```ts
function onNavigated(eventChannel) {
  // Send event to the target page
  eventChannel?.emit('init', { message: 'Data from the opener page' })
}
```

## Slots

### default

Default slot for the navigation link content:

```vue
<RouterLink to="pages/about/about">
  <text>Go to About</text>
</RouterLink>

<!-- Complex content -->
<RouterLink :to="{ name: 'detail', query: { id: item.id } }">
  <view class="card">
    <image :src="item.cover" />
    <text>{{ item.title }}</text>
    <text>{{ item.desc }}</text>
  </view>
</RouterLink>
```

## Examples

### Basic Usage

```vue
<template>
  <RouterLink to="pages/about/about">
    <text>About Us</text>
  </RouterLink>
</template>

<script setup lang="ts">
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
</script>
```

### Replace Mode

```vue
<!-- After successful login, navigate to home, avoid leaving login page in stack -->
<RouterLink to="pages/home/home" replace>
  <text>Login</text>
</RouterLink>
```

### Relaunch Mode

```vue
<!-- Logout, clear all pages -->
<RouterLink to="pages/login/login" relaunch>
  <text>Logout</text>
</RouterLink>
```

### With Query Parameters

```vue
<!-- String form -->
<RouterLink to="pages/about/about?id=1&tab=info">
  <text>Article Detail</text>
</RouterLink>

<!-- Object form (recommended) -->
<RouterLink :to="{ name: 'about', query: { id: '1', tab: 'info' } }">
  <text>Article Detail</text>
</RouterLink>
```

### With Page Parameters (params)

```vue
<!-- Pass complex data -->
<RouterLink
  :to="{ path: 'pages/detail/detail' }"
  :params="{ id: 123, info: { name: 'Tom', age: 20 } }"
>
  <text>View Details</text>
</RouterLink>
```

### Page Communication

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: handleUpdate }"
  @navigated="onNavigated"
>
  <text>View Details</text>
</RouterLink>

<script setup lang="ts">
function handleUpdate(data: any) {
  console.log('Received update from target page:', data)
}

function onNavigated(eventChannel: any) {
  // Send init data to the target page
  eventChannel?.emit('init', { message: 'Init data' })
}
</script>
```

### Custom Animation

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom', duration: 500 }">
  <text>Slide In Bottom</text>
</RouterLink>
```

### Handling Navigation Errors

```vue
<RouterLink :to="{ name: 'admin' }" @error="onNavError">
  <text>Admin Panel</text>
</RouterLink>
```

### List Scenario

```vue
<template>
  <view class="list">
    <RouterLink
      v-for="item in list"
      :key="item.id"
      :to="{ name: 'detail', query: { id: item.id } }"
      :params="{ item }"
    >
      <view class="card">
        <text>{{ item.title }}</text>
      </view>
    </RouterLink>
  </view>
</template>
```

## Differences from vue-router RouterLink

| Feature              | vue-router         | Uni Router         |
| -------------------- | ------------------ | ------------------ |
| Host element         | `<a>`              | `<navigator>`      |
| `to` type            | `string \| object` | `string \| object` |
| `replace`            | ✅                 | ✅                 |
| `relaunch`           | ❌                 | ✅                 |
| `custom`             | ✅                 | ❌                 |
| `active-class`       | ✅                 | ❌                 |
| `exact-active-class` | ✅                 | ❌                 |
| `v-slot` scoped slot | ✅                 | ❌                 |
| `hover-class`        | ❌                 | ✅                 |
| `animation`          | ❌                 | ✅                 |
| `events`             | ❌                 | ✅                 |
| `params`             | ❌                 | ✅                 |
| `persistent`         | ❌                 | ✅                 |
| `error` event        | ❌                 | ✅                 |
| `navigated` event    | ❌                 | ✅                 |

### Why active-class is not supported

vue-router's `active-class` relies on real-time browser URL matching, while uni-app's navigation is managed by the native page stack, and components cannot perceive the current page state. To highlight the link corresponding to the current page, manually check via `useRoute()`:

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
const isActive = (name: string) => route.value.name === name
</script>

<template>
  <RouterLink to="pages/home/home">
    <text :class="{ active: isActive('home') }">Home</text>
  </RouterLink>
</template>
```

### Why custom is not supported

vue-router's `custom` allows fully custom rendering logic, relying on `<a>` tags and browser navigation. uni-app's `<navigator>` is a native component and cannot be fully customized for rendering. To trigger custom navigation, use APIs like `router.push()`.

## Next Steps

- [Router Instance](./router-instance) — Programmatic navigation API
- [Route Navigation](../guide/navigation) — Deep dive into the four navigation modes
- [RouteLocationRaw Type](./type-route-location) — Type definition of the `to` prop
