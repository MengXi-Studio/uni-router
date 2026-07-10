# TabBar

Custom bottom navigation bar component. Must be used with [`TabBarItem`](./tab-bar-item).

## Import

```ts
import TabBar from '@meng-xi/uni-router/components/tab-bar/tab-bar.vue'
import TabBarItem from '@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue'
```

::: info Direct .vue file import
`TabBar` / `TabBarItem` are standalone Vue component files. You need to import the `.vue` file path directly. It's recommended to configure auto-import in `pages.json`'s `easycom`, or register globally in `main.ts`.
:::

### Global Registration

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'
import TabBar from '@meng-xi/uni-router/components/tab-bar/tab-bar.vue'
import TabBarItem from '@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  app.component('TabBar', TabBar)
  app.component('TabBarItem', TabBarItem)
  return { app }
}
```

### easycom Auto-import

```json
// pages.json
{
  "easycom": {
    "custom": {
      "^tab-bar$": "@meng-xi/uni-router/components/tab-bar/tab-bar.vue",
      "^tab-bar-item$": "@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue"
    }
  }
}
```

## Props

### color

- **Type**: `string`
- **Default**: `'#7A7E83'`
- **Description**: Default text color

### selectedColor

- **Type**: `string`
- **Default**: `'#007AFF'`
- **Description**: Selected text color

### bgColor

- **Type**: `string`
- **Default**: `'#ffffff'`
- **Description**: Background color, also used as badge ring color

### borderStyle

- **Type**: `'black' | 'white'`
- **Default**: `'black'`
- **Description**: Top border color style

### fixed

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to fix at the bottom

### border

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to show top border

### placeholder

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to generate a placeholder element of equal height when `fixed`, preventing content from being obscured

### safeAreaInsetBottom

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to enable bottom safe area inset (for iPhone X, etc.)

### zIndex

- **Type**: `number | string`
- **Default**: `999`
- **Description**: Element z-index

### beforeChange

- **Type**: `(item: TabBarItemProps, index: number) => boolean | Promise<boolean>`
- **Default**: `undefined`
- **Description**: Interceptor before switching, return `false` or reject to prevent switching; supports async

```vue
<script setup lang="ts">
function onBeforeChange(item, index) {
  if (item.to === '/pages/vip/vip' && !isVip()) {
    uni.showToast({ title: 'VIP only', icon: 'none' })
    return false
  }
  return true
}
</script>

<template>
  <TabBar :before-change="onBeforeChange">
    <TabBarItem to="/pages/index/index" text="Home" />
    <TabBarItem to="/pages/vip/vip" text="VIP" />
  </TabBar>
</template>
```

## Events

### change

- **Parameter**: `(item: TabBarItemProps, index: number)`
- **Description**: Emitted after tab switch succeeds

```vue
<TabBar @change="onChange">
  <TabBarItem to="/pages/index/index" text="Home" />
</TabBar>
```

```ts
function onChange(item, index) {
  console.log('Switched to:', item.text, 'index:', index)
}
```

### error

- **Parameter**: `(error: NavigationFailure)`
- **Description**: Emitted when navigation fails (e.g., guard abort, duplicate navigation)

## Slots

### default

Default slot for `TabBarItem` children.

## CSS Custom Properties

| Property | Default | Description |
| --- | --- | --- |
| `--mx-tabbar-height` | `50px` | Bar height |
| `--mx-tabbar-background` | `#ffffff` | Background color (auto-set by `bgColor` prop) |
| `--mx-tabbar-border-color` | `#e5e5e5` | Top border color |

Override example:

```css
:root {
  --mx-tabbar-height: 60px;
  --mx-tabbar-border-color: #f0f0f0;
}
```

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import TabBar from '@meng-xi/uni-router/components/tab-bar/tab-bar.vue'
import TabBarItem from '@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue'
</script>

<template>
  <TabBar>
    <TabBarItem to="/pages/index/index" icon-path="/static/home.png" selected-icon-path="/static/home-active.png" text="Home" />
    <TabBarItem to="/pages/about/about" icon-path="/static/user.png" selected-icon-path="/static/user-active.png" text="Profile" />
  </TabBar>
</template>
```

### Fixed Bottom + Placeholder

```vue
<TabBar fixed placeholder>
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="Home" />
</TabBar>
```

### Switch Interceptor

```vue
<TabBar :before-change="onBeforeChange">
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="Home" />
  <TabBarItem to="/pages/vip/vip" icon-path="/static/vip.png" text="VIP" />
</TabBar>
```

## Next Steps

- [TabBarItem](./tab-bar-item) — Navigation item component
- [RouterLink](./router-link) — Declarative navigation component
