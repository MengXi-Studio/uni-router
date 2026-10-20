# usePageChannel()

获取当前页面与导航方之间的双向通信通道。必须在 Vue 组件的 `setup()` 函数中调用。

::: tip 前置条件
需在 `createRouter({ useUniEventChannel: true })` 时启用内置通信管理器。默认模式下（`useUniEventChannel: false`）始终返回 no-op channel，调用 `on` / `emit` 均无效果。
:::

## 类型

```ts
function usePageChannel(): EventChannel
```

## 返回值

返回 [`EventChannel`](https://uniapp.dcloud.net.cn/api/router.html#navigateto) 实例，提供以下方法：

| 方法 | 说明 |
| --- | --- |
| `on(event, callback)` | 监听导航方发来的事件 |
| `once(event, callback)` | 监听一次事件，触发后自动移除 |
| `off(event, callback?)` | 移除事件监听器 |
| `emit(event, ...args)` | 向导航方发送事件 |

- 有 `__nav_id` 时返回与导航方共享的 `UniEventChannel` 实例
- 无 `__nav_id` 时返回 `noopChannel`（空操作通道，避免调用方需判空）
- 页面卸载时自动销毁通道并清理所有监听器

## 工作原理

`usePageChannel()` 内部读取 `route.params.__navId`：

```
导航方 push/replace/relaunch
  → 生成唯一 navId（如 nav-1700000000000-1）
  → 创建 UniEventChannel 并注册到通道表
  → __nav_id 注入 URL query 持久化（H5 刷新不丢失）

目标页面 usePageChannel()
  → 从 route.params.__navId 读取 navId
  → 从通道表获取已注册的通道（复用）
  → 页面卸载时销毁对应通道
```

事件名通过 `uni-router:<navId>:<event>` 格式隔离，基于 `uni.$emit` / `uni.$on` 全局事件总线通信，确保不同导航之间的事件互不干扰。

::: tip 粘性事件缓存
内置通道实现粘性事件机制：`emit` 时**总是**缓存事件参数；`on` / `once` 注册监听器时若已有缓存，会**异步触发**（不删除缓存）。

这解决了导航方 `emit` 与目标页面 `setup` 注册监听器的时序竞争——无论 `emit` 和 `on` 的先后顺序，所有监听器都能收到最后一次 `emit` 的数据。
:::

## 调用约束

::: warning 必须在 setup 中调用
`usePageChannel()` 依赖 `useRouter()`（内部使用 Vue 的 `inject`），只能在组件的 `setup()` 函数（或 `<script setup>`）中调用。
:::

## 示例

### 基本用法

```vue
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// 监听导航方发送的事件
channel.on('init', (data) => {
  console.log('收到初始化数据:', data)
})

// 向导航方发送事件
channel.emit('ready', { status: 'loaded' })
</script>
```

### 配合 push 双向通信

```ts
// 发起页
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

const { eventChannel } = await router.push({
  name: 'detail',
  params: { id: 123 },
  events: {
    // 监听目标页面发来的事件
    ready(data) { console.log('目标页已就绪:', data) }
  }
})

// 向目标页面发送事件
eventChannel.emit('init', { message: '初始化数据' })
```

```vue
<!-- 目标页面 detail.vue -->
<script setup lang="ts">
import { usePageChannel } from '@meng-xi/uni-router'

const channel = usePageChannel()

// 监听发起页发送的事件
channel.on('init', (data) => {
  console.log('收到初始化:', data)
})

// 通知发起页已就绪
channel.emit('ready', { status: 'loaded' })
</script>
```

### replace / relaunch 也能通信

启用 `useUniEventChannel` 后，`replace` / `relaunch` 同样返回 `eventChannel`：

```ts
// replace 后仍可与目标页通信
const { eventChannel } = await router.replace({
  name: 'detail',
  params: { id: 123 }
})

eventChannel.emit('init', { source: 'replace' })
```

### 一次性监听

```ts
const channel = usePageChannel()

// once 仅触发一次，适合"仅初始化一次"的场景
channel.once('init', (data) => {
  console.log('仅接收一次:', data)
})
```

::: tip once 与粘性缓存
即使 `emit` 早于 `once` 注册（导航方先 emit，目标页后注册 once），`once` 仍会通过缓存收到数据。缓存不会被删除，因此后续注册的 `on` 也能收到。
:::

## 与原生 getOpenerEventChannel 的差异

| 特性 | 原生 `getOpenerEventChannel()` | `usePageChannel()` |
| --- | --- | --- |
| 适用导航方式 | 仅 `push`（`navigateTo`） | 所有导航方式（`push` / `replace` / `relaunch`） |
| 时序问题 | emit 早于 on 时事件丢失 | 粘性缓存，不丢失 |
| 调用方式 | `getCurrentPages()[last].getOpenerEventChannel()` | 直接调用，自动绑定 |
| 生命周期清理 | 手动管理 | 页面卸载自动销毁 |
| H5 刷新 | 通道丢失 | `__nav_id` 持久化，可重建 |
| 前置条件 | 无 | 需 `useUniEventChannel: true` |

## 下一步

- [RouterOptions](./type-router-options) — 查看 `useUniEventChannel` 选项
- [组合式 API 指南](../guide/composables) — 组合式 API 的深入使用
- [路由导航 - 页面间通信](../guide/navigation#特殊用法-页面间通信) — 通信机制详解
