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

::: tip 响应式原理
`useRoute()` 返回的是响应式引用，当路由发生变化时会自动更新。同一路由器实例共享同一个响应式 ref，确保所有组件获取一致的路由状态。

底层实现：路由器内部维护一个 `ref<RouteLocation>`，每次导航完成或状态同步时更新此 ref，所有 `useRoute()` 调用都返回同一个 ref。
:::

## 调用约束

::: warning 必须在 setup 中调用
`useRoute()` 依赖 Vue 的 `inject`，只能在组件的 `setup()` 函数（或 `<script setup>`）中调用。在以下场景调用会抛出 `SETUP_ERROR`：

- 普通函数 / 工具方法
- 模块顶层
- 异步回调（setTimeout、Promise.then 等）
:::

## 抛出异常

| 错误码        | 条件                                |
| ------------- | ----------------------------------- |
| `SETUP_ERROR` | 在 setup 外调用                     |
| `SETUP_ERROR` | 未通过 `app.use(router)` 安装路由器 |

## 示例

### 基本用法

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 在 <script setup> 中通过 .value 访问
console.log(route.value.path)
console.log(route.value.query.id)
console.log(route.value.params.info)
console.log(route.value.meta.title)
</script>
```

```vue
<template>
  <!-- 模板中自动解包，无需 .value -->
  <view>当前路径：{{ route.path }}</view>
  <view>查询参数：{{ route.query.id }}</view>
  <view>页面参数：{{ route.params.id }}</view>
  <view>页面标题：{{ route.meta.title }}</view>
</template>
```

### 读取查询参数（类型解析）

`RouteLocation` 提供三个类型解析方法，避免手动转换：

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 假设 URL: /pages/detail/detail?id=123&price=19.99&enabled=true

// queryInt - 解析为整数
const id = route.value.queryInt('id')        // 123
const page = route.value.queryInt('page', 1) // 1（默认值）

// queryNumber - 解析为数值（支持浮点）
const price = route.value.queryNumber('price')     // 19.99
const total = route.value.queryNumber('total', 0)  // 0（默认值）

// queryBool - 解析为布尔值
const enabled = route.value.queryBool('enabled')         // true
const visible = route.value.queryBool('visible', false)  // false（默认值）
</script>
```

::: tip 类型解析规则
- `queryInt()` / `queryNumber()`：解析失败时返回 `defaultValue`，未提供则为 `undefined`
- `queryBool()`：仅识别 `'true'` / `'1'` → `true`，`'false'` / `'0'` → `false`，其他值返回 `defaultValue`
:::

### 读取页面参数（params）

`params` 用于传递复杂数据，不暴露在 URL 中：

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 假设导航时传入: router.push({ path: '/detail', params: { id: 123, info: { name: 'Tom' } } })
console.log(route.value.params.id)      // 123
console.log(route.value.params.info)    // { name: 'Tom' }
console.log(route.value.params.info.name) // 'Tom'
</script>
```

::: warning params 的局限
1. **不支持函数、Symbol 等非 JSON 可序列化值**
2. **TabBar 页面**：由于 `switchTab` 不支持 query，`__params_key` 无法传递，TabBar 页面无法接收 params
3. **页面栈同步**：`back()` 后目标页面的 params 通过 `peek` 读取（避免误删）
4. **默认不持久化**：H5 刷新后会丢失，需配置 `persistent: true`
:::

### 监听路由变化

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 监听路径变化
watch(
  () => route.value.path,
  (newPath, oldPath) => {
    console.log('路径变化:', oldPath, '→', newPath)
  }
)

// 监听查询参数
watch(
  () => route.value.query.id,
  (newId) => {
    if (newId) fetchDetail(newId)
  }
)
</script>
```

### 配合 onShow 同步状态

物理返回键、浏览器后退不经过路由器，`route` 不会自动更新。需在 `onShow` 中调用 `syncRoute()`：

```vue
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

onShow(() => {
  // 同步后 route 会自动更新
  router.syncRoute()
  console.log('当前页面:', route.value.path)
})
</script>
```

### 在非组件代码中读取路由

在 Pinia store、工具函数等非组件场景中，**直接使用路由器实例的 `currentRoute`**：

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  function getCurrentPath() {
    // ✅ 直接读取 currentRoute
    return router.currentRoute.path
  }

  function getCurrentQuery() {
    return router.currentRoute.query
  }

  return { getCurrentPath, getCurrentQuery }
})
```

::: warning currentRoute 非响应式
在非组件场景中读取 `router.currentRoute` **不是响应式**的，获取的是当前快照值。如需响应式更新，需在组件中使用 `useRoute()`。
:::

## 与 vue-router 的差异

| 特性 | vue-router | Uni Router |
| --- | --- | --- |
| 返回类型 | `RouteLocationNormalized` | `Ref<RouteLocation>` |
| 响应式 | ✅ | ✅ |
| `params` | URL 路径参数（如 `/user/:id`） | 内存参数（不暴露 URL） |
| 类型解析方法 | ❌ | `queryInt()` / `queryNumber()` / `queryBool()` |
| 物理返回同步 | 自动 | 需手动 `syncRoute()` |

## 下一步

- [RouteLocation 类型](./type-route-location) — 路由位置的完整字段
- [useRouter()](./use-router) — 获取路由器实例
- [组合式 API 指南](../guide/composables) — 组合式 API 的深入使用
