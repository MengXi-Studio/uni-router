# RouterLink

导航组件，点击时触发路由跳转。基于 uni-app 的 `<view>` 组件实现。

## 引入

```ts
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'
```

::: info `RouterLink` 是一个独立的 Vue 组件文件，需要直接引入 `.vue` 文件路径，而非从包入口导入。:::

## Props

### to

- **类型**: `string`
- **必填**: 是
- **说明**: 目标页面路径，需与路由配置中的 `path` 一致

### replace

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用替换模式导航
  - `false` → 调用 `router.push(to)`
  - `true` → 调用 `router.replace(to)`

## 事件

组件通过 `@click` 触发导航，不发射自定义事件。

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

## 与 vue-router RouterLink 的差异

| 特性                 | vue-router         | Uni Router               |
| -------------------- | ------------------ | ------------------------ |
| 宿主元素             | `<a>`              | `<view>`                 |
| `to` 类型            | `string \| object` | `string`（仅路径字符串） |
| `replace`            | ✅                 | ✅                       |
| `custom`             | ✅                 | ❌                       |
| `active-class`       | ✅                 | ❌                       |
| `exact-active-class` | ✅                 | ❌                       |
| `v-slot` 作用域插槽  | ✅                 | ❌                       |
| `aria-current`       | ✅                 | ❌                       |

::: warning `RouterLink` 的 `to` 属性仅支持路径字符串，不支持 `{ name: 'about' }` 形式的命名路由对象。如需使用命名路由导航，请直接调用 `router.push({ name: 'about' })`。:::
