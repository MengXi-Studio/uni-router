# 组合式 API

Uni Router 提供三个组合式函数（Composables），用于在 Vue 3 的 `<script setup>` 中访问路由器实例、当前路由以及页面间通信通道。本章详细讲解用法、响应式原理和实战技巧。

## useRouter()

获取当前路由器实例。必须在 Vue 组件的 `setup()` 函数中调用，且需先通过 `app.use(router)` 安装路由器。

### 基本用法

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

// 编程式导航
await router.push({ name: 'about' })
await router.replace({ name: 'home' })
await router.back()
await router.relaunch({ name: 'login' })
```

### 完整示例

```vue
<template>
  <view>
    <button @click="goAbout">前往关于页</button>
    <button @click="goBack">返回</button>
    <button @click="replaceHome">替换为首页</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function goAbout() {
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('导航失败:', err)
  }
}

async function goBack() {
  try {
    await router.back()
  } catch (err) {
    // 栈不足，回退到首页
    await router.relaunch({ name: 'home' })
  }
}

async function replaceHome() {
  await router.replace({ name: 'home' })
}
</script>
```

### 错误情况

| 场景 | 错误码 | 说明 |
| --- | --- | --- |
| 在 setup 外调用 | `SETUP_ERROR` | `inject` 只能在 setup 中使用 |
| 未安装路由器 | `SETUP_ERROR` | 需先调用 `app.use(router)` |

```ts
// ❌ 在 setup 外调用
const router = useRouter() // 报错

// ✅ 在 setup 中调用
import { useRouter } from '@meng-xi/uni-router'

export default {
  setup() {
    const router = useRouter() // 正确
    return { router }
  }
}
```

## useRoute()

获取当前路由位置的响应式引用。必须在 Vue 组件的 `setup()` 函数中调用。

### 基本用法

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 在 <script setup> 中通过 .value 访问
console.log(route.value.path)
console.log(route.value.query)
console.log(route.value.params)
console.log(route.value.meta)
```

```vue
<template>
  <!-- 模板中自动解包，无需 .value -->
  <text>当前路径：{{ route.path }}</text>
  <text>查询参数：{{ route.query.id }}</text>
  <text>页面参数：{{ route.params.id }}</text>
  <text>页面标题：{{ route.meta.title }}</text>
</template>
```

### 响应式特性

`useRoute()` 返回 `Ref<RouteLocation>`，路由变化时自动更新：

```ts
import { useRoute } from '@meng-xi/uni-router'
import { watch } from 'vue'

const route = useRoute()

// 监听路由变化
watch(
  () => route.value.query.id,
  (newId, oldId) => {
    console.log('ID 变化:', oldId, '→', newId)
    if (newId) fetchDetail(newId)
  }
)
```

::: tip 共享响应式
同一路由器实例共享同一个响应式 ref，确保所有组件获取一致的路由状态。路由变化时，所有使用 `useRoute()` 的组件都会更新。
:::

### RouteLocation 详解

`useRoute()` 返回的 `RouteLocation` 包含以下字段：

```ts
interface RouteLocation {
  path: string                    // 页面路径
  name?: string                   // 路由名称
  query: Record<string, string>   // 查询参数
  params: Record<string, any>     // 页面参数（复杂数据）
  meta: RouteMeta                 // 路由元信息
  fullPath: string                // 完整路径（含 query）
  _synced?: boolean               // 是否为状态同步（物理返回等）
}
```

#### query 便捷方法

`query` 提供类型转换方法，自动解析字符串为对应类型：

```ts
const route = useRoute()

// 基本访问（string）
const id = route.value.query.id           // '123'

// 类型转换
const pageNum = route.value.queryInt('page', 1)      // 123
const price = route.value.queryNumber('price', 0)    // 99.9
const enabled = route.value.queryBool('enabled', false) // true
```

| 方法 | 返回类型 | 说明 |
| --- | --- | --- |
| `queryInt(key, default?)` | `number` | 解析为整数 |
| `queryNumber(key, default?)` | `number` | 解析为浮点数 |
| `queryBool(key, default?)` | `boolean` | 解析为布尔值 |

::: tip 默认值
所有便捷方法都接受默认值参数，当 query 不存在或解析失败时返回默认值。
:::

### params 访问

```ts
const route = useRoute()

// 访问 params（复杂数据）
const item = route.value.params.item as Item
const list = route.value.params.list as Item[]
```

::: warning params 限制
`params` 功能需要注册 `ParamsPlugin`。未注册时使用将抛出 `PLUGIN_REQUIRED` 错误。

其余限制：
- params 通过内存存储，H5 刷新后丢失
- params 仅在 `push` 时可用，`replace` / `relaunch` 后可能丢失
- 详见[导航 - params 传递复杂数据](./navigation#params-传递复杂数据)
:::

## usePageChannel()

获取当前页面与导航方之间的双向通信通道。必须在 Vue 组件的 `setup()` 函数中调用。

::: tip 前置条件
需注册 `ChannelPlugin` 并设置 `useUniEventChannel: true`：
```ts
import { createRouter, ChannelPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [...],
  plugins: [ChannelPlugin],
  useUniEventChannel: true
})
```
未注册 ChannelPlugin 时，`events` 参数将抛出 `PLUGIN_REQUIRED` 错误。默认模式下（`useUniEventChannel: false`），`usePageChannel()` 返回 no-op channel。
:::

### 基本用法

```ts
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// 监听导航方发送的事件
channel.on('init', (data) => {
  console.log('收到初始化数据:', data)
})

// 向导航方发送事件
channel.emit('ready', { status: 'loaded' })
```

### 工作原理

`usePageChannel()` 内部读取 `route.params.__navId`：

- 有 `navId` 时返回与导航方共享的 `UniEventChannel` 实例（基于 `uni.$emit` / `uni.$on`）
- 无 `navId` 时返回 `noopChannel`，避免调用方需判空
- 页面卸载时自动销毁通道，清理所有事件监听器

```ts
// 发起页：push/replace/relaunch 均可返回 eventChannel
const { eventChannel } = await router.push({
  name: 'detail',
  params: { id: 123 },
  events: {
    ready(data) { console.log('目标页就绪:', data) }
  }
})
eventChannel.emit('init', { message: '初始化数据' })
```

```vue
<!-- 目标页面 -->
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

channel.on('init', (data) => {
  console.log('收到初始化:', data)
})

channel.emit('ready', { status: 'loaded' })
</script>
```

### 粘性事件缓存

内置通道实现粘性事件机制，解决导航方 `emit` 早于目标页面 `setup` 注册监听器的时序问题：

- `emit` 时**总是**缓存事件参数
- `on` / `once` 注册监听器时若已有缓存，会**异步触发**（不删除缓存）
- 无论 `emit` 和 `on` 的先后顺序，所有监听器都能收到最后一次 `emit` 的数据

```ts
// 即使发起页 emit 在目标页 on 之前执行，监听器仍能收到数据
channel.on('init', (data) => {
  // ✅ 能收到数据（通过缓存异步触发）
  console.log('收到:', data)
})

channel.once('init', (data) => {
  // ✅ 也能收到（once 通过缓存触发时手动移除 wrapper）
  console.log('仅一次:', data)
})
```

::: tip 与原生 getOpenerEventChannel 的差异
- 原生 `getOpenerEventChannel()` 仅 `push` 可用，且 emit 早于 on 时事件丢失
- `usePageChannel()` 支持所有导航方式（需 `useUniEventChannel: true`），粘性缓存不丢失事件
- `__nav_id` 持久化到 URL，H5 刷新后仍可重建通道
:::

详见 [`usePageChannel()` API](../api/use-page-channel) 与[页面间通信](./navigation#特殊用法-页面间通信)。

## 在非组件中使用

在 Pinia store、工具函数等非组件场景中，无法使用 `useRouter()` / `useRoute()`。此时直接导入路由器实例：

```ts
// router/index.ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({ routes })

export default router
```

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  async function login(credentials) {
    const { token } = await loginApi(credentials)
    uni.setStorageSync('token', token)

    // 在 store 中使用路由器
    await router.push({ name: 'home' })
  }

  function getCurrentPath() {
    // 访问当前路由（非响应式）
    return router.currentRoute.path
  }

  return { login, getCurrentPath }
})
```

::: warning 非响应式
`router.currentRoute` 是普通属性，非响应式。如需响应式，仍需在组件中用 `useRoute()`。
:::

## 在选项式 API 中使用

如果使用选项式 API，可通过 `this.$router` 和 `this.$route` 访问：

```vue
<script>
export default {
  computed: {
    currentPath() {
      return this.$route.path
    },
    pageTitle() {
      return this.$route.meta.title
    }
  },
  methods: {
    navigate() {
      this.$router.push({ name: 'about' })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>
```

### 全局属性注册

`app.use(router)` 会自动注册 `$router` 和 `$route` 全局属性：

```ts
// main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router) // 注册 $router 和 $route
  return { app }
}
```

## 实战技巧

### 1. 封装导航逻辑

```ts
// composables/use-nav.ts
import { useRouter } from '@meng-xi/uni-router'
import { ref } from 'vue'

export function useNav() {
  const router = useRouter()
  const loading = ref(false)

  async function safePush(location) {
    loading.value = true
    try {
      await router.push(location)
    } catch (err) {
      if (err.code !== 'NAVIGATION_DUPLICATED') {
        uni.showToast({ title: '导航失败', icon: 'none' })
        console.error(err)
      }
    } finally {
      loading.value = false
    }
  }

  async function safeBack(fallback?) {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      await router.back()
    } else if (fallback) {
      await router.relaunch(fallback)
    } else {
      await router.relaunch({ name: 'home' })
    }
  }

  return { loading, safePush, safeBack }
}
```

### 2. 监听路由变化

```ts
import { useRoute } from '@meng-xi/uni-router'
import { watch, computed } from 'vue'

const route = useRoute()

// 监听 path 变化
watch(
  () => route.value.path,
  (newPath) => {
    console.log('页面切换:', newPath)
  }
)

// 监听 query 变化
watch(
  () => route.value.query,
  (newQuery) => {
    console.log('查询参数变化:', newQuery)
  },
  { deep: true }
)

// 计算属性
const isLoginPage = computed(() => route.value.name === 'login')
const requireAuth = computed(() => route.value.meta.requireAuth === true)
```

### 3. 页面参数处理

```ts
import { useRoute } from '@meng-xi/uni-router'
import { ref, onMounted } from 'vue'

const route = useRoute()
const detail = ref(null)

onMounted(async () => {
  // 从 query 获取 ID
  const id = route.value.queryInt('id', 0)
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  // 从 params 获取复杂数据
  const previewData = route.value.params.preview
  if (previewData) {
    detail.value = previewData // 直接使用预加载数据
  } else {
    detail.value = await fetchDetail(id) // 网络请求
  }
})
```

### 4. 条件渲染

```vue
<template>
  <view>
    <text v-if="route.meta.requireAuth">需要登录</text>
    <text v-else>公开页面</text>

    <button v-if="route.name !== 'home'" @click="goHome">回首页</button>
  </view>
</template>

<script setup>
import { useRoute, useRouter } from '@meng-xi/uni-router'

const route = useRoute()
const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
}
</script>
```

## 完整示例

```vue
<template>
  <view class="container">
    <text>当前路径：{{ route.path }}</text>
    <text>页面标题：{{ route.meta.title }}</text>
    <text>查询参数：{{ JSON.stringify(route.query) }}</text>
    <text>页面参数：{{ JSON.stringify(route.params) }}</text>

    <view v-if="loading">导航中...</view>

    <button @click="goAbout">前往关于页</button>
    <button @click="goBack">返回</button>
    <button @click="replaceHome">替换为首页</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'
import { ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

// 监听路由变化
watch(
  () => route.value.path,
  (newPath) => {
    console.log('路由变化:', newPath)
  }
)

async function goAbout() {
  loading.value = true
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('导航失败:', err)
  } finally {
    loading.value = false
  }
}

async function goBack() {
  try {
    await router.back()
  } catch (err) {
    // 栈不足，回首页
    await router.relaunch({ name: 'home' })
  }
}

async function replaceHome() {
  await router.replace({ name: 'home' })
}
</script>
```

## 下一步

- [路由配置](./route-config) — 路由配置详解
- [导航](./navigation) — 导航 API 用法
- [插件系统](./plugins) — 了解插件注册机制
- [API 参考](../api/create-router) — 完整 API 文档
