# 快速开始

本节帮助你在 uni-app 项目中快速集成 Uni Router，从安装到完整使用。

## 前置准备

确保你的项目满足以下条件：

- uni-app 项目（基于 Vue 3）
- 已有 `pages.json` 配置文件
- 页面已在 `pages.json` 中声明

::: warning Vue 2 不支持
Uni Router 仅兼容 Vue 3，依赖 Vue 3 的 Composition API（`inject` / `ref`）、`app.provide`、`<script setup>` 等特性。
:::

## 安装

::: code-group

```bash [pnpm]
pnpm add @meng-xi/uni-router
```

```bash [npm]
npm install @meng-xi/uni-router
```

```bash [yarn]
yarn add @meng-xi/uni-router
```

:::

详见[安装指南](./installation)。

## 第一步：定义路由配置

创建 `src/router/index.ts`，定义与 `pages.json` 一致的路由配置：

```ts
// src/router/index.ts
import { createRouter } from '@meng-xi/uni-router'
import type { RouteConfig } from '@meng-xi/uni-router'

const routes: RouteConfig[] = [
  {
    path: 'pages/index/index',
    name: 'home',
    meta: { title: '首页', isTab: true }
  },
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { title: '关于', requireAuth: true }
  },
  {
    path: 'pages/login/login',
    name: 'login',
    meta: { title: '登录' }
  },
  {
    path: 'pages/user/user',
    name: 'user',
    meta: { title: '我的', isTab: true }
  }
]

const router = createRouter({
  routes,
  strict: true,
  interceptUniApi: true,  // 拦截原生 API，确保守卫生效
  guardTimeout: 15000     // 守卫超时（毫秒）
})

export default router
```

::: tip 自动生成
推荐使用 [`@meng-xi/vite-plugin`](./auto-generate) 从 `pages.json` 自动生成路由配置，避免手动维护。
:::

## 第二步：注册路由器

在 `main.ts` 中安装路由器：

```ts
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
  const app = createSSRApp(App)
  app.use(router) // 注册 $router 和 $route 全局属性
  return { app }
}
```

## 第三步：配置路由守卫

在 `router/index.ts` 中添加守卫：

```ts
// 登录状态检查
function isLoggedIn(): boolean {
  return !!uni.getStorageSync('token')
}

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 未登录访问受保护页面
  if (to.meta.requireAuth && !isLoggedIn()) {
    next(
      { name: 'login', query: { redirect: to.fullPath } },
      { mode: 'replace' }
    )
    return
  }

  // 已登录访问登录页
  if (to.name === 'login' && isLoggedIn()) {
    next({ name: 'home' }, { mode: 'replace' })
    return
  }

  next()
})

// 全局后置钩子
router.afterEach((to) => {
  // 自动设置页面标题
  if (to.meta.title) {
    uni.setNavigationBarTitle({ title: to.meta.title as string })
  }
})
```

## 第四步：在页面中使用

### 组合式 API（推荐）

```vue
<!-- pages/index/index.vue -->
<template>
  <view class="container">
    <text>当前路径：{{ route.path }}</text>
    <text>页面标题：{{ route.meta.title }}</text>

    <button @click="goAbout">前往关于页</button>
    <button @click="goUser">前往我的</button>
    <button @click="goBack">返回</button>
  </view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

async function goAbout() {
  try {
    await router.push({ name: 'about', query: { from: 'home' } })
  } catch (err) {
    console.error('导航失败:', err)
  }
}

async function goUser() {
  await router.push({ name: 'user' })
}

async function goBack() {
  try {
    await router.back()
  } catch {
    // 栈不足，回首页
    await router.relaunch({ name: 'home' })
  }
}
</script>
```

### 选项式 API

```vue
<template>
  <view>
    <text>当前路径：{{ $route.path }}</text>
    <button @click="goAbout">前往关于页</button>
  </view>
</template>

<script>
export default {
  methods: {
    goAbout() {
      this.$router.push({ name: 'about', query: { id: '1' } })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>
```

## 第五步：使用 RouterLink 组件

```vue
<template>
  <view>
    <!-- 路径字符串 -->
    <RouterLink to="pages/about/about">关于</RouterLink>

    <!-- 命名路由 -->
    <RouterLink :to="{ name: 'about' }">关于</RouterLink>

    <!-- 带 query -->
    <RouterLink :to="{ name: 'about', query: { id: '1' } }">关于 1</RouterLink>
  </view>
</template>

<script setup>
import { RouterLink } from '@meng-xi/uni-router'
</script>
```

## 第六步：处理页面同步

在 `App.vue` 中处理路由状态同步（物理返回等场景）：

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onShow(() => {
  // 同步路由状态（处理物理返回等场景）
  router.syncRoute()
})
</script>
```

## 完整示例

### 登录页

```vue
<!-- pages/login/login.vue -->
<template>
  <view class="login">
    <input v-model="username" placeholder="用户名" />
    <input v-model="password" type="password" placeholder="密码" />
    <button @click="handleLogin" :loading="loading">登录</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const { token } = await loginApi(username.value, password.value)
    uni.setStorageSync('token', token)

    // 登录成功，返回原页面
    const redirect = route.value.query.redirect as string
    if (redirect) {
      await router.replace(redirect)
    } else {
      await router.relaunch({ name: 'home' })
    }
  } catch (err) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loginApi(username: string, password: string) {
  // 模拟登录 API
  return new Promise<{ token: string }>((resolve) => {
    setTimeout(() => resolve({ token: 'mock-token' }), 500)
  })
}
</script>
```

### 受保护页面

```vue
<!-- pages/about/about.vue -->
<template>
  <view>
    <text>关于页面</text>
    <text>来自：{{ route.query.from }}</text>
    <button @click="goBack">返回</button>
  </view>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '@meng-xi/uni-router'

const route = useRoute()
const router = useRouter()

function goBack() {
  router.back()
}
</script>
```

## 目录结构

完成后的项目结构：

```
src/
├── main.ts                  # 应用入口
├── App.vue                  # 根组件
├── pages.json               # uni-app 页面配置
├── router/
│   └── index.ts             # 路由器实例 + 守卫
└── pages/
    ├── index/
    │   └── index.vue        # 首页
    ├── about/
    │   └── about.vue        # 关于页
    ├── login/
    │   └── login.vue        # 登录页
    └── user/
        └── user.vue         # 用户页
```

## 下一步

- [路由配置](./route-config) — 详细了解路由配置
- [导航](./navigation) — 四种导航方式详解
- [路由守卫](./guards) — 完整守卫机制
- [实战指南](./recipes) — 完整业务方案
- [平台兼容性](./compatibility) — uni-app 限制
