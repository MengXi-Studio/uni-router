# useRouter()

获取当前路由器实例。必须在 Vue 组件的 `setup()` 函数中调用。

## 类型

```ts
function useRouter(): Router
```

## 返回值

返回 [`Router`](./router-instance) 实例。

## 抛出异常

| 错误码 | 条件 |
|--------|------|
| `SETUP_ERROR` | 在 setup 外调用 |
| `SETUP_ERROR` | 未通过 `app.use(router)` 安装路由器 |

## 示例

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function navigate() {
  await router.push({ name: 'about' })
}
</script>
```
