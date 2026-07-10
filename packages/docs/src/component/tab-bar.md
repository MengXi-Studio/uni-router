# TabBar

自定义底部导航栏组件。需与 [`TabBarItem`](./tab-bar-item) 配合使用。

## 引入

```ts
import TabBar from '@meng-xi/uni-router/components/tab-bar/tab-bar.vue'
import TabBarItem from '@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue'
```

::: info 直接引入 .vue 文件
`TabBar` / `TabBarItem` 是独立 Vue 组件文件，需直接引入 `.vue` 文件路径。可通过 `pages.json` 的 `easycom` 配置自动引入，或在 `main.ts` 中全局注册。
:::

### 全局注册

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

### easycom 自动引入

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

- **类型**: `string`
- **默认值**: `'#7A7E83'`
- **说明**: 默认文字颜色

### selectedColor

- **类型**: `string`
- **默认值**: `'#007AFF'`
- **说明**: 选中文字颜色

### bgColor

- **类型**: `string`
- **默认值**: `'#ffffff'`
- **说明**: 背景色，同时作为徽标描边环色

### borderStyle

- **类型**: `'black' | 'white'`
- **默认值**: `'black'`
- **说明**: 顶部边框颜色风格

### fixed

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否固定在底部

### border

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否显示顶部边框

### placeholder

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: `fixed` 时是否生成等高占位元素，避免内容被遮挡

### safeAreaInsetBottom

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否开启底部安全区适配（iPhone X 等机型）

### zIndex

- **类型**: `number | string`
- **默认值**: `999`
- **说明**: 元素 z-index

### beforeChange

- **类型**: `(item: TabBarItemProps, index: number) => boolean | Promise<boolean>`
- **默认值**: `undefined`
- **说明**: 切换前拦截器，返回 `false` 或 `reject` 可阻止切换；支持异步

```vue
<script setup lang="ts">
function onBeforeChange(item, index) {
  if (item.to === '/pages/vip/vip' && !isVip()) {
    uni.showToast({ title: '请先开通会员', icon: 'none' })
    return false
  }
  return true
}
</script>

<template>
  <TabBar :before-change="onBeforeChange">
    <TabBarItem to="/pages/index/index" text="首页" />
    <TabBarItem to="/pages/vip/vip" text="会员" />
  </TabBar>
</template>
```

## 事件

### change

- **参数**: `(item: TabBarItemProps, index: number)`
- **说明**: 点击 tab 切换成功后触发

```vue
<TabBar @change="onChange">
  <TabBarItem to="/pages/index/index" text="首页" />
</TabBar>
```

```ts
function onChange(item, index) {
  console.log('切换到:', item.text, '索引:', index)
}
```

### error

- **参数**: `(error: NavigationFailure)`
- **说明**: 导航失败时触发（如守卫中止、重复导航）

## 插槽

### default

默认插槽，放置 `TabBarItem` 子组件。

## CSS 自定义属性

| 属性名 | 默认值 | 说明 |
| --- | --- | --- |
| `--mx-tabbar-height` | `50px` | 栏高度 |
| `--mx-tabbar-background` | `#ffffff` | 背景色（由 `bgColor` prop 自动设置） |
| `--mx-tabbar-border-color` | `#e5e5e5` | 顶部边框颜色 |

覆盖示例：

```css
:root {
  --mx-tabbar-height: 60px;
  --mx-tabbar-border-color: #f0f0f0;
}
```

## 示例

### 基本用法

```vue
<script setup lang="ts">
import TabBar from '@meng-xi/uni-router/components/tab-bar/tab-bar.vue'
import TabBarItem from '@meng-xi/uni-router/components/tab-bar-item/tab-bar-item.vue'
</script>

<template>
  <TabBar>
    <TabBarItem to="/pages/index/index" icon-path="/static/home.png" selected-icon-path="/static/home-active.png" text="首页" />
    <TabBarItem to="/pages/about/about" icon-path="/static/user.png" selected-icon-path="/static/user-active.png" text="我的" />
  </TabBar>
</template>
```

### 固定底部 + 占位

```vue
<TabBar fixed placeholder>
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
</TabBar>
```

### 切换拦截

```vue
<TabBar :before-change="onBeforeChange">
  <TabBarItem to="/pages/index/index" icon-path="/static/home.png" text="首页" />
  <TabBarItem to="/pages/vip/vip" icon-path="/static/vip.png" text="会员" />
</TabBar>
```

## 下一步

- [TabBarItem](./tab-bar-item) — 导航项组件
- [RouterLink](./router-link) — 声明式导航组件
