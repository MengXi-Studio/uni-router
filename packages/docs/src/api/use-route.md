# useRoute()

获取当前路由位置信息。必须在 Vue 组件的 `setup()` 函数中调用。

## 类型

```ts
function useRoute(): RouteLocation
```

## 返回值

返回当前 [`RouteLocation`](./type-route-location) 快照。

::: warning
返回的是调用时刻的路由位置快照，不会自动响应后续路由变化。
:::

## 抛出异常

| 错误码 | 条件 |
|--------|------|
| `SETUP_ERROR` | 在 setup 外调用 |
| `SETUP_ERROR` | 未通过 `app.use(router)` 安装路由器 |

## 示例

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
console.log(route.path)
console.log(route.query)
console.log(route.meta.title)
</script>
```
