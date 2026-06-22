# RouterLink

Navigation component that triggers route navigation on click. Built on uni-app's `<navigator>` component with native touch feedback support.

## Import

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info
`RouterLink` is a standalone Vue component file. You need to import the `.vue` file path directly,
not from the package entry.
:::

## Props

### to

- **Type**: `RouteLocationRaw`
- **Required**: Yes
- **Description**: Target route location, supports the following forms:
  - Path string: `'pages/about/about'`
  - Path object: `{ path: 'pages/about/about', query: { id: '1' } }`
  - Named object: `{ name: 'about', query: { id: '1' } }`

### replace

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use replace mode for navigation
  - `false` → calls `router.push(to)`
  - `true` → calls `router.replace(to)`

### relaunch

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use relaunch mode for navigation (close all pages and open target page)
  - `true` → calls `router.relaunch(to)`
  - Takes priority over `replace`; when both `relaunch` and `replace` are set, `relaunch` is used

```vue
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
```

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
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123, info: { name: 'Tom' } }">
  <text>View Details</text>
</RouterLink>
```

### persistent

- **Type**: `boolean | undefined`
- **Default**: `undefined`
- **Description**: Whether to persist page parameters to storage. When set to `true`, parameters are persisted via `uni.setStorageSync`, readable after H5 refresh. Falls back to `RouterOptions.paramsPersistent` default when not specified.

```vue
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123 }" persistent>
  <text>View Details (Persistent)</text>
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
	}
}
```

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
  <text>About Us</text>
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
<RouterLink to="pages/login/login" replace>
  <text>Login</text>
</RouterLink>
```

### With Query Parameters

```vue
<RouterLink to="pages/about/about?id=1">
  <text>Article Detail</text>
</RouterLink>
```

### Named Route

```vue
<RouterLink :to="{ name: 'about', query: { id: '1' } }">
  <text>Article Detail</text>
</RouterLink>
```

### Path Object

```vue
<RouterLink :to="{ path: 'pages/about/about', query: { id: '1' } }">
  <text>Article Detail</text>
</RouterLink>
```

### Handling Navigation Errors

```vue
<RouterLink :to="{ name: 'admin' }" @error="onNavError">
  <text>Admin Panel</text>
</RouterLink>
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

::: warning
When passing an object to the `to` prop, use `:to` binding (`v-bind:to`) instead of the string attribute `to`.
:::
