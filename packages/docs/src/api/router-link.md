# RouterLink

导航组件，点击时触发路由跳转。基于 uni-app 的 `<navigator>` 组件封装，支持原生触摸反馈。

## 引入

```ts
import RouterLink from '@meng-xi/uni-router/components/router-link/router-link.vue'
```

::: info 直接引入 .vue 文件
`RouterLink` 是一个独立的 Vue 组件文件，需要直接引入 `.vue` 文件路径，而非从包入口导入。建议在 `pages.json` 的 `easycom` 中配置自动引入，或在 `main.ts` 中全局注册。
:::

### 全局注册（推荐）

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'
import RouterLink from '@meng-xi/uni-router/components/router-link/router-link.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  app.component('RouterLink', RouterLink) // 全局注册
  return { app }
}
```

注册后可在任何组件中直接使用 `<RouterLink>`，无需每次导入。

## Props

### to

- **类型**: `RouteLocationRaw`
- **必填**: 是
- **说明**: 目标路由位置，支持以下形式：
  - 路径字符串：`'pages/about/about'`
  - 路径对象：`{ path: 'pages/about/about', query: { id: '1' } }`
  - 命名对象：`{ name: 'about', query: { id: '1' } }`

```vue
<!-- 路径字符串 -->
<RouterLink to="pages/about/about">关于</RouterLink>

<!-- 路径对象（需用 :to 绑定） -->
<RouterLink :to="{ path: 'pages/about/about', query: { id: '1' } }">详情</RouterLink>

<!-- 命名路由（推荐） -->
<RouterLink :to="{ name: 'about', query: { id: '1' } }">详情</RouterLink>
```

::: warning 对象形式必须用 :to 绑定
`to` 属性传入对象时需使用 `:to` 绑定（`v-bind:to`），而非字符串属性 `to`。字符串形式 `to="pages/about/about"` 可直接使用。
:::

### replace

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用替换模式导航
  - `false` → 调用 `router.push(to)`
  - `true` → 调用 `router.replace(to)`

```vue
<!-- 登录页跳转，避免登录页留在栈中 -->
<RouterLink to="pages/home/home" replace>
  <text>登录</text>
</RouterLink>
```

### relaunch

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否使用 relaunch 模式导航（关闭所有页面并打开目标页面）
  - `true` → 调用 `router.relaunch(to)`
  - 优先级高于 `replace`，同时设置 `relaunch` 和 `replace` 时使用 `relaunch`

```vue
<!-- 退出登录，清空栈 -->
<RouterLink to="pages/login/login" relaunch>
  <text>退出登录</text>
</RouterLink>

<!-- 从深层页面回首页 -->
<RouterLink to="pages/index/index" relaunch>
  <text>返回首页</text>
</RouterLink>
```

### animation

- **类型**: `NavigationAnimation | undefined`
- **默认值**: `undefined`
- **说明**: 导航动画（仅 App 端生效），覆盖 `meta.animation`。未指定时使用目标路由的 `meta.animation`

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // 默认 300ms
}
```

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom' }">
  <text>底部滑入</text>
</RouterLink>

<RouterLink to="pages/about/about" :animation="{ type: 'fade-in', duration: 500 }">
  <text>淡入（500ms）</text>
</RouterLink>
```

::: warning 平台限制
动画**仅 App 端生效**。小程序和 H5 的导航动画由系统控制，无法自定义。`relaunch` 即使在 App 端也不支持动画。
:::

### events

- **类型**: `EventListeners | undefined`
- **默认值**: `undefined`
- **说明**: 页面间通信事件监听器，对应 `uni.navigateTo` 的 `events` 参数，用于监听目标页面通过 `eventChannel.emit` 发送的事件。默认仅 `push` 时生效；启用 `useUniEventChannel` 后所有导航方式均生效。

```ts
type EventListeners = Record<string, (...args: any[]) => void>
```

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: (data) => console.log('收到更新:', data) }"
  @navigated="onNavigated"
>
  <text>查看详情</text>
</RouterLink>
```

### params

- **类型**: `ParamObject | undefined`
- **默认值**: `undefined`
- **说明**: 页面参数，支持传递复杂数据（对象、数组等 JSON 可序列化值），不暴露在 URL 中。通过内部 Map 存储，目标页面通过 `route.params` 读取。

```vue
<!-- 传递简单数据 -->
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123 }">
  <text>查看详情</text>
</RouterLink>

<!-- 传递复杂数据 -->
<RouterLink
  :to="{ path: 'pages/detail/detail' }"
  :params="{ id: 123, info: { name: 'Tom', age: 20 }, tags: ['a', 'b'] }"
>
  <text>查看详情</text>
</RouterLink>
```

::: tip params vs query
- `query`：拼接到 URL，仅支持字符串，适合简单参数（如 id、page）
- `params`：内存存储，支持复杂数据，不暴露 URL，适合大对象

TabBar 页面只能用 `params`（`switchTab` 不支持 query）。
:::

### persistent

- **类型**: `boolean | undefined`
- **默认值**: `undefined`
- **说明**: 页面参数是否持久化到 storage。设为 `true` 时，参数通过 `uni.setStorageSync` 持久化存储，H5 刷新后仍可读取。未指定时使用 `RouterOptions.paramsPersistent` 的默认值。

```vue
<!-- 单次导航持久化 -->
<RouterLink :to="{ path: 'pages/detail/detail' }" :params="{ id: 123 }" persistent>
  <text>查看详情（H5 刷新不丢失）</text>
</RouterLink>
```

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
    case RouterErrorCode.NAVIGATION_API_ERROR:
      uni.showToast({ title: '导航失败', icon: 'none' })
      console.error('原始错误:', error.cause)
      break
  }
}
```

::: tip 建议监听 error 事件
不监听 `error` 事件时，导航失败会静默处理（不会抛出未捕获的 Promise 拒绝）。但建议在生产环境监听并处理错误，提升用户体验。
:::

### navigated

- **参数**: `(eventChannel: EventChannel | undefined)`
- **说明**: 导航成功后触发，返回 `eventChannel` 用于页面间通信。默认仅 `push` 模式下 `eventChannel` 有值；启用 `useUniEventChannel` 后 `replace` / `relaunch` 也可获取 `eventChannel`。

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: (data) => console.log('收到更新:', data) }"
  @navigated="onNavigated"
>
  <text>查看详情</text>
</RouterLink>
```

```ts
function onNavigated(eventChannel) {
  // 向目标页面发送事件
  eventChannel?.emit('init', { message: '来自发起页面的数据' })
}
```

## 插槽

### default

默认插槽，用于放置导航链接的内容：

```vue
<RouterLink to="pages/about/about">
  <text>前往关于页</text>
</RouterLink>

<!-- 复杂内容 -->
<RouterLink :to="{ name: 'detail', query: { id: item.id } }">
  <view class="card">
    <image :src="item.cover" />
    <text>{{ item.title }}</text>
    <text>{{ item.desc }}</text>
  </view>
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
import RouterLink from '@meng-xi/uni-router/components/router-link/router-link.vue'
</script>
```

### 替换模式

```vue
<!-- 登录成功后跳首页，避免登录页留在栈中 -->
<RouterLink to="pages/home/home" replace>
  <text>登录</text>
</RouterLink>
```

### 重置模式

```vue
<!-- 退出登录，清空所有页面 -->
<RouterLink to="pages/login/login" relaunch>
  <text>退出登录</text>
</RouterLink>
```

### 带查询参数

```vue
<!-- 字符串形式 -->
<RouterLink to="pages/about/about?id=1&tab=info">
  <text>文章详情</text>
</RouterLink>

<!-- 对象形式（推荐） -->
<RouterLink :to="{ name: 'about', query: { id: '1', tab: 'info' } }">
  <text>文章详情</text>
</RouterLink>
```

### 带页面参数（params）

```vue
<!-- 传递复杂数据 -->
<RouterLink
  :to="{ path: 'pages/detail/detail' }"
  :params="{ id: 123, info: { name: 'Tom', age: 20 } }"
>
  <text>查看详情</text>
</RouterLink>
```

### 页面间通信

```vue
<RouterLink
  :to="{ path: 'pages/detail/detail', query: { id: '1' } }"
  :events="{ update: handleUpdate }"
  @navigated="onNavigated"
>
  <text>查看详情</text>
</RouterLink>

<script setup lang="ts">
function handleUpdate(data: any) {
  console.log('收到目标页面更新:', data)
}

function onNavigated(eventChannel: any) {
  // 向目标页面发送初始化数据
  eventChannel?.emit('init', { message: '初始化数据' })
}
</script>
```

### 自定义动画

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom', duration: 500 }">
  <text>底部滑入</text>
</RouterLink>
```

### 处理导航错误

```vue
<RouterLink :to="{ name: 'admin' }" @error="onNavError">
  <text>管理后台</text>
</RouterLink>
```

### 列表场景

```vue
<template>
  <view class="list">
    <RouterLink
      v-for="item in list"
      :key="item.id"
      :to="{ name: 'detail', query: { id: item.id } }"
      :params="{ item }"
    >
      <view class="card">
        <text>{{ item.title }}</text>
      </view>
    </RouterLink>
  </view>
</template>
```

## 与 vue-router RouterLink 的差异

| 特性                 | vue-router         | Uni Router         |
| -------------------- | ------------------ | ------------------ |
| 宿主元素             | `<a>`              | `<navigator>`      |
| `to` 类型            | `string \| object` | `string \| object` |
| `replace`            | ✅                 | ✅                 |
| `relaunch`           | ❌                 | ✅                 |
| `custom`             | ✅                 | ❌                 |
| `active-class`       | ✅                 | ❌                 |
| `exact-active-class` | ✅                 | ❌                 |
| `v-slot` 作用域插槽  | ✅                 | ❌                 |
| `hover-class`        | ❌                 | ✅                 |
| `animation`          | ❌                 | ✅                 |
| `events`             | ❌                 | ✅                 |
| `params`             | ❌                 | ✅                 |
| `persistent`         | ❌                 | ✅                 |
| `error` 事件         | ❌                 | ✅                 |
| `navigated` 事件     | ❌                 | ✅                 |

### 不支持 active-class 的原因

vue-router 的 `active-class` 依赖浏览器 URL 实时匹配，而 uni-app 的导航由原生页面栈管理，组件无法感知当前页面状态。如需高亮当前页面对应的链接，可通过 `useRoute()` 手动判断：

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()
const isActive = (name: string) => route.value.name === name
</script>

<template>
  <RouterLink to="pages/home/home">
    <text :class="{ active: isActive('home') }">首页</text>
  </RouterLink>
</template>
```

### 不支持 custom 的原因

vue-router 的 `custom` 允许完全自定义渲染逻辑，依赖 `<a>` 标签和浏览器导航。uni-app 的 `<navigator>` 是原生组件，无法完全自定义渲染行为。如需自定义导航触发，使用 `router.push()` 等 API。

## 下一步

- [Router 实例](./router-instance) — 编程式导航 API
- [路由导航](../guide/navigation) — 四种导航方式的深入讲解
- [RouteLocationRaw 类型](./type-route-location) — `to` 属性的类型定义
