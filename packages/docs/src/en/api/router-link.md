# RouterLink

Navigation component that triggers route navigation on click. Built on uni-app's `<view>` component.

## Import

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info `RouterLink` is a standalone Vue component file. You need to import the `.vue` file path directly, not from the package entry. :::

## Props

### to

- **Type**: `string`
- **Required**: Yes
- **Description**: Target page path, must match the `path` in route configuration

### replace

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to use replace mode for navigation
  - `false` → calls `router.push(to)`
  - `true` → calls `router.replace(to)`

## Events

The component triggers navigation via `@click` and does not emit custom events.

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

## Differences from vue-router RouterLink

| Feature              | vue-router         | Uni Router                  |
| -------------------- | ------------------ | --------------------------- |
| Host element         | `<a>`              | `<view>`                    |
| `to` type            | `string \| object` | `string` (path string only) |
| `replace`            | ✅                 | ✅                          |
| `custom`             | ✅                 | ❌                          |
| `active-class`       | ✅                 | ❌                          |
| `exact-active-class` | ✅                 | ❌                          |
| `v-slot` scoped slot | ✅                 | ❌                          |
| `aria-current`       | ✅                 | ❌                          |

::: warning The `to` prop of `RouterLink` only supports path strings. Named route objects like `{ name: 'about' }` are not supported. For named route navigation, use `router.push({ name: 'about' })` directly. :::
