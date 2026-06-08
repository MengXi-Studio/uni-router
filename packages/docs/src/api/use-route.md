# useRoute()

获取当前路由位置的响应式引用。必须在 Vue 组件的 `setup()` 函数中调用。

## 类型

```ts
function useRoute(): Ref<RouteLocation>
```

## 返回值

返回当前 [`RouteLocation`](./type-route-location) 的响应式引用（`Ref<RouteLocation>`）。

- 在 `<script setup>` 中通过 `route.value` 访问路由信息
- 在模板中自动解包，直接使用 `route.path` 等
- 路由变化时自动更新，组件会重新渲染

::: tip `useRoute()` 返回的是响应式引用，当路由发生变化时会自动更新。同一路由器实例共享同一个响应式 ref，确保所有组件获取一致的路由状态。:::

## 抛出异常

| 错误码        | 条件                                |
| ------------- | ----------------------------------- |
| `SETUP_ERROR` | 在 setup 外调用                     |
| `SETUP_ERROR` | 未通过 `app.use(router)` 安装路由器 |

## 示例

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 在 <script setup> 中通过 .value 访问
console.log(route.value.path)
console.log(route.value.query)
console.log(route.value.meta.title)
</script>
```

```vue
<template>
	<!-- 模板中自动解包，无需 .value -->
	<text>当前路径：{{ route.path }}</text>
	<text>查询参数：{{ route.query.id }}</text>
</template>
```
