# RouterLink

Navigation component that triggers route navigation on click. Built on uni-app's `<navigator>` component with native touch feedback support.

## Import

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info `RouterLink` is a standalone Vue component file. You need to import the `.vue` file path directly, not from the package entry. :::

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

::: warning When passing an object to the `to` prop, use `:to` binding (`v-bind:to`) instead of the string attribute `to`. :::
