# useRouter()

在 Vue 组件的 `setup()` 中获取当前路由器实例，是组合式 API 的入口。

## 类型

```ts
function useRouter(): Router
```

## 返回值

返回 [`Router`](./router-instance) 实例。

## 调用约束

::: warning 必须在 setup 中调用
`useRouter()` 依赖 Vue 的 `inject`，只能在组件的 `setup()` 函数（或 `<script setup>`）中调用。在以下场景调用会抛出 `SETUP_ERROR`：

- 普通函数 / 工具方法
- 模块顶层
- 异步回调（setTimeout、Promise.then 等）
- 事件处理函数（但可在事件处理函数中**使用**已获取的 router）
:::

## 抛出异常

| 错误码 | 条件 |
|--------|------|
| `SETUP_ERROR` | 在 setup 外调用 |
| `SETUP_ERROR` | 未通过 `app.use(router)` 安装路由器 |

## 示例

### 基本用法

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function goAbout() {
  await router.push({ name: 'about' })
}

function back() {
  router.back()
}
</script>

<template>
  <button @click="goAbout">前往关于页</button>
  <button @click="back">返回</button>
</template>
```

### 在事件处理中使用

```vue
<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function handleLogin() {
  // 登录逻辑...
  await router.replace({ name: 'home' })
}

async function handleLogout() {
  // 登出逻辑...
  await router.relaunch({ name: 'login' })
}
</script>
```

### 配合 onShow 同步状态

```vue
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// 物理返回键后同步状态
onShow(() => {
  router.syncRoute()
})
</script>
```

### 在非组件代码中使用

在 Pinia store、工具函数等非组件场景中，**直接导入路由器实例**而非使用 `useRouter()`：

```ts
// src/router/index.ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({ /* ... */ })
export default router
```

```ts
// src/store/user.ts
import { defineStore } from 'pinia'
import router from '@/router'  // 直接导入

export const useUserStore = defineStore('user', () => {
  async function logout() {
    // ✅ 直接使用导入的 router
    await router.relaunch({ name: 'login' })
  }

  return { logout }
})
```

::: tip useRouter vs 直接导入
- **组件内**：优先使用 `useRouter()`，符合组合式 API 风格，便于测试和依赖注入
- **组件外**（Pinia、工具函数）：直接导入路由器实例，避免 `inject` 限制
:::

## 与 vue-router 的差异

| 特性 | vue-router | Uni Router |
| --- | --- | --- |
| 调用位置 | setup 中 | setup 中 |
| 非组件使用 | 可通过 `inject` + 上下文 | 直接导入实例 |
| 返回类型 | `Router` | `Router` |
| 错误处理 | 抛出警告 | 抛出 `RouterError`（`SETUP_ERROR`） |

## 下一步

- [Router 实例](./router-instance) — 路由器实例的完整 API
- [useRoute()](./use-route) — 获取当前路由位置
- [组合式 API 指南](../guide/composables) — 组合式 API 的深入使用
