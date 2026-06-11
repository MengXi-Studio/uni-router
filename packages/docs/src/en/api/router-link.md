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
| `custom`             | ✅                 | ❌                 |
| `active-class`       | ✅                 | ❌                 |
| `exact-active-class` | ✅                 | ❌                 |
| `v-slot` scoped slot | ✅                 | ❌                 |
| `hover-class`        | ❌                 | ✅                 |
| `animation`          | ❌                 | ✅                 |
| `error` event        | ❌                 | ✅                 |

::: warning
When passing an object to the `to` prop, use `:to` binding (`v-bind:to`) instead of the string attribute `to`.
:::
