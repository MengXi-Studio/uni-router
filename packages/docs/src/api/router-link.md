# RouterLink

导航组件，点击时触发路由跳转。基于 uni-app 的 `<navigator>` 组件封装，支持原生触摸反馈。

## 引入

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info
`RouterLink` 是一个独立的 Vue 组件文件，需要直接引入 `.vue` 文件路径，而非从包入口导入。
:::

## Props

### to

- **类型**: `RouteLocationRaw`
- **必填**: 是
- **说明**: 目标路由位置，支持以下形式：
  - 路径字符串：`'pages/about/about'`
  - 路径对象：`{ path: 'pages/about/about', query: { id: '1' } }`
  - 命名对象：`{ name: 'about', query: { id: '1' } }`

### replace

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用替换模式导航
  - `false` → 调用 `router.push(to)`
  - `true` → 调用 `router.replace(to)`

### hoverClass

- **类型**: `string`
- **默认值**: `'navigator-hover'`
- **说明**: 按下时的样式类，对应 `<navigator>` 的 `hover-class` 属性。设置为 `'none'` 可禁用点击态

### hoverStopPropagation

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否阻止祖先节点的点击态

### hoverStartTime

- **类型**: `number`
- **默认值**: `50`
- **说明**: 按住后多久出现点击态，单位 ms

### hoverStayTime

- **类型**: `number`
- **默认值**: `600`
- **说明**: 手指松开后点击态保留时间，单位 ms

## 事件

### error

- **参数**: `(error: NavigationFailure)`
- **说明**: 导航失败时触发，如守卫中止、重复导航等。不监听时静默处理，不会产生 Unhandled Promise Rejection。

```vue
<RouterLink to="pages/about/about" @error="onNavError">
  <text>关于我们</text>
</RouterLink>
```

```ts
import { NavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

function onNavError(error: NavigationFailure) {
	switch (error.code) {
		case RouterErrorCode.NAVIGATION_ABORTED:
			console.log('导航被守卫中止')
			break
		case RouterErrorCode.NAVIGATION_DUPLICATED:
			console.log('已在当前页面')
			break
	}
}
```

## 插槽

### default

默认插槽，用于放置导航链接的内容：

```vue
<RouterLink to="pages/about/about">
  <text>前往关于页</text>
</RouterLink>
```

## 示例

### 基本用法

```vue
<template>
	<RouterLink to="pages/about/about">
		<text>关于我们</text>
	</RouterLink>
</template>

<script setup lang="ts">
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
</script>
```

### 替换模式

```vue
<RouterLink to="pages/login/login" replace>
  <text>登录</text>
</RouterLink>
```

### 带查询参数

```vue
<RouterLink to="pages/about/about?id=1">
  <text>文章详情</text>
</RouterLink>
```

### 命名路由

```vue
<RouterLink :to="{ name: 'about', query: { id: '1' } }">
  <text>文章详情</text>
</RouterLink>
```

### 路径对象

```vue
<RouterLink :to="{ path: 'pages/about/about', query: { id: '1' } }">
  <text>文章详情</text>
</RouterLink>
```

### 处理导航错误

```vue
<RouterLink :to="{ name: 'admin' }" @error="onNavError">
  <text>管理后台</text>
</RouterLink>
```

## 与 vue-router RouterLink 的差异

| 特性                 | vue-router         | Uni Router         |
| -------------------- | ------------------ | ------------------ |
| 宿主元素             | `<a>`              | `<navigator>`      |
| `to` 类型            | `string \| object` | `string \| object` |
| `replace`            | ✅                 | ✅                 |
| `custom`             | ✅                 | ❌                 |
| `active-class`       | ✅                 | ❌                 |
| `exact-active-class` | ✅                 | ❌                 |
| `v-slot` 作用域插槽  | ✅                 | ❌                 |
| `hover-class`        | ❌                 | ✅                 |
| `error` 事件         | ❌                 | ✅                 |

::: warning
`RouterLink` 的 `to` 属性传入对象时需使用 `:to` 绑定（`v-bind:to`），而非字符串属性 `to`。
:::
