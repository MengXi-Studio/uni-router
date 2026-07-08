# 常见问题

汇总使用 Uni Router 过程中的高频问题与排查思路。

## 守卫不生效

### 现象

配置了 `beforeEach`，但守卫逻辑未执行。

### 排查

**1. 是否通过路由器调用**

```ts
// ❌ 直接调用 uni API，守卫不生效
uni.navigateTo({ url: '/pages/about/about' })

// ✅ 通过路由器调用
await router.push({ name: 'about' })
```

**解决方案**：启用 `interceptUniApi: true`，拦截所有原生 API 调用。

**2. 守卫是否正确返回**

```ts
// ❌ 忘记调用 next
router.beforeEach((to, from, next) => {
  if (needAuth) {
    next({ name: 'login' })
  }
  // 漏了 else 分支的 next()
})

// ✅ 所有分支都调用 next
router.beforeEach((to, from, next) => {
  if (needAuth) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

**3. 异步守卫是否正确 await**

```ts
// ❌ 异步操作未 await，next 在异步前调用
router.beforeEach((to, from, next) => {
  fetchUser().then(user => {
    if (!user) next({ name: 'login' })
  })
  next() // 这里立即执行了
})

// ✅ 异步守卫用 async/await
router.beforeEach(async (to, from, next) => {
  const user = await fetchUser()
  if (!user) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

## params 丢失

### 现象

`router.push({ path: 'detail', params: { id: 123 } })` 后，目标页面 `route.params` 为空。

### 原因

Uni Router 的 params 通过内存存储 + URL key 实现。可能的原因：

**1. 页面刷新（H5）**

params 存在内存中，H5 刷新后内存丢失。

```ts
// ❌ H5 刷新后 params 丢失
const route = useRoute()
console.log(route.params.id) // undefined
```

**解决方案**：用 query 传递关键参数，params 仅用于传递复杂对象。

```ts
// 关键参数用 query
await router.push({ path: 'detail', query: { id: '123' } })

// 复杂对象用 params（接受刷新丢失）
await router.push({
  path: 'detail',
  query: { id: '123' },
  params: { detailData: largeObject }
})
```

**2. 页面栈被清理**

`relaunch` 或栈溢出后，原页面被销毁，params 也被清理。注意：`back()` 返回原页面时 params **不会丢失**（实际导航 URL 保留了 `__params_key`，可重建 params）。

**3. 读取时机错误**

params 在页面 `onLoad` 时已就绪，但需要通过 `useRoute()` 读取。

```ts
// ❌ 直接访问全局变量
import { router } from '@/router'
console.log(router.currentRoute.params.id) // 可能未更新

// ✅ 使用 useRoute
import { useRoute } from '@meng-xi/uni-router'
const route = useRoute()
console.log(route.params.id) // 正确
```

## 页面栈溢出

### 现象

小程序中导航报错：`navigateTo:fail webview count limit exceed`。

### 原因

小程序页面栈上限 10 层，超过后 `navigateTo` 失败。

### 解决方案

使用 `useSafeNav` 封装，接近上限时改用 `relaunch`：

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

async function safePush(location) {
  const pages = getCurrentPages()
  if (pages.length >= 8) {
    await router.relaunch(location)
  } else {
    await router.push(location)
  }
}
```

详见[实战指南 - 页面栈深度管理](./recipes#页面栈深度管理)。

## 物理返回无法拦截

### 现象

用户按物理返回键（Android 返回键、小程序顶部返回箭头），守卫未触发。

### 原因

这是 uni-app 的平台限制：

- **App 端**：可通过 `onBackPress` 拦截
- **H5 端**：浏览器返回键无法拦截，只能监听 `popstate` 事后处理
- **小程序端**：顶部返回箭头无法拦截

### 解决方案

```ts
// App 端：onBackPress
import { onBackPress } from '@dcloudio/uni-app'

onBackPress(() => {
  if (hasUnsavedData) {
    showConfirmDialog()
    return true // 阻止默认返回
  }
  return false
})

// 全平台：onRouteChange 事后处理
// currentRoute 已通过 install() 中的全局 mixin 自动 syncRoute，无需手动调用
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

router.onRouteChange((to, from) => {
  if (to._synced) {
    // 状态同步（可能是物理返回触发）
    handleBackNavigation(to, from)
  }
})
```

详见[平台兼容性](./compatibility#物理返回键无法拦截)。

## switchTab 的 query 丢失

### 现象

```ts
await router.push({ name: 'user', query: { tab: 'orders' } })
// 目标页面 route.query.tab 为 undefined
```

### 原因

`uni.switchTab` 不支持 query 参数。当目标路由 `meta.isTab: true` 时，路由器会调用 `switchTab`，query 被丢弃。

### 解决方案

用全局状态传递参数：

```ts
// 发起页
const tabStore = useTabStore()
tabStore.setTabParam('user', { tab: 'orders' })
await router.push({ name: 'user' })

// 目标页 onShow
onShow(() => {
  // currentRoute 已被全局 mixin 自动 syncRoute，无需手动调用
  const param = tabStore.getTabParam('user')
  if (param?.tab) {
    activeTab.value = param.tab
    tabStore.clearTabParam('user')
  }
})
```

详见[实战指南 - TabBar 页面数据传递](./recipes#tabbar-页面数据传递)。

## afterEach 不触发

### 现象

物理返回后，`afterEach` 钩子未执行。

### 原因

物理返回是 uni-app 原生行为，不经过路由器的导航流程，因此 `afterEach` 不触发。

### 解决方案

用 `onRouteChange` 监听所有路由变化（包括状态同步）：

```ts
router.onRouteChange((to, from) => {
  console.log('路由变化:', from.path, '→', to.path)
  // 物理返回也会触发
})

// 区分完整导航和状态同步
router.onRouteChange((to, from) => {
  if (to._synced) {
    // 状态同步（物理返回等）
  } else {
    // 完整导航
  }
})
```

详见[导航流程原理 - 状态同步机制](./navigation-flow#状态同步机制)。

## 守卫中触发导航死锁

### 现象

在守卫中调用 `router.push()`，导航卡住无响应。

### 原因

```ts
// ❌ 死锁
router.beforeEach((to, from, next) => {
  router.push({ name: 'other' }) // 触发新导航，等待当前导航完成
  next()                          // 当前导航等待守卫完成
  // 互相等待 → 死锁
})
```

### 解决方案

用 `next(location)` 重定向，而非在守卫中调用 `router.push`：

```ts
// ✅ 重定向
router.beforeEach((to, from, next) => {
  if (needRedirect) {
    next({ name: 'other' }) // 重定向，不形成死锁
  } else {
    next()
  }
})
```

## 重复导航错误

### 现象

```ts
await router.push({ name: 'about' })
await router.push({ name: 'about' }) // 抛出 NavigationFailure
```

### 原因

`push` 到相同位置（path + name + query 一致）会抛出 `NAVIGATION_DUPLICATED` 错误，防止无意义的重复入栈。

### 解决方案

**1. 捕获并忽略**

```ts
try {
  await router.push({ name: 'about' })
} catch (err) {
  if (err.code !== 'NAVIGATION_DUPLICATED') throw err
}
```

**2. 改用 replace**

```ts
await router.replace({ name: 'about' }) // replace 不检测重复
```

**3. 封装安全 push**

```ts
async function safePush(location) {
  try {
    await router.push(location)
  } catch (err) {
    if (err.code === 'NAVIGATION_DUPLICATED') return
    throw err
  }
}
```

## H5 刷新 404

### 现象

H5 环境下，访问 `https://example.com/pages/about/about` 刷新后 404。

### 原因

Uni Router 使用 hash 模式（`#/path`），但用户可能直接访问不带 hash 的 URL。

### 解决方案

**1. 使用 hash 模式**

确保 URL 形如 `https://example.com/#/pages/about/about`，刷新后 hash 保留。

**2. 服务器配置重定向**

如果是 history 模式，需配置服务器将所有路径重定向到 index.html：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

::: warning uni-app H5 限制
uni-app 的 H5 路由由 `manifest.json` 的 `h5.router.mode` 控制，Uni Router 在其之上工作。建议保持 uni-app 的 hash 模式以避免刷新问题。
:::

## TabBar 页面 onShow 不触发

### 现象

从 TabBar 页面 A 切换到 TabBar 页面 B，再切回 A，A 的 `onShow` 未触发。

### 排查

**1. 是否用了 `switchTab`**

`switchTab` 切换 TabBar 页面时，`onShow` 应正常触发。如果未触发，检查是否用了 `reLaunch`。

**2. 是否在 `onShow` 中读取了正确的 `currentRoute`**

路由器在 `install()` 时已通过全局 mixin 自动在每个页面 `onShow` 调用 `syncRoute()`，**无需手动调用**。直接通过 `useRoute()` 读取即可：

```ts
// ✅ currentRoute 已被 mixin 自动同步
import { onShow } from '@dcloudio/uni-app'
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

onShow(() => {
  console.log(route.value.path, route.value.query)
  // 其他逻辑
})
```

如需在 `onLoad`（早于 `onShow`）中读取路由信息，可手动调用一次 `router.syncRoute()`。

**3. 页面是否被销毁**

`reLaunch` 会销毁所有页面。如果用 `reLaunch` 切换 Tab，`onShow` 不会触发（页面是新的实例，触发 `onLoad`）。

## 路由器初始化时机

### 现象

在 `App.vue` 的 `onLaunch` 中访问 `router.currentRoute`，值为初始值而非当前页面。

### 原因

路由器在 `App.vue` 的 `setup` 阶段初始化，此时页面栈可能尚未建立。

### 解决方案

```ts
// App.vue
import { onLaunch } from '@dcloudio/uni-app'
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

onLaunch(() => {
  // 此时路由器已初始化，但页面栈可能未就绪
  console.log(router.currentRoute) // 初始值
})

// 路由器在 install() 时已注册全局 mixin，会在每个页面 onShow 自动 syncRoute
// 因此页面级 onShow 中无需手动调用 router.syncRoute()
```

::: tip 冷启动守卫校验
若需要在 `onLaunch` 中对真实入口页面执行守卫，应传入 `options.path`：

```ts
onLaunch((options) => {
  router.isReady().then(() => {
    const launchPath = options?.path ? `/${options.path}` : undefined
    router.guardRoute(launchPath, {
      onAbort: (failure) => {
        router.relaunch({ name: 'home' })
      }
    })
  })
})
```

直接调用 `guardRoute(undefined)` 会校验 `START_LOCATION`（path `/`）而非真实入口页面，详见 [Router 实例 - guardRoute()](../api/router-instance#guardroute)。
:::

## 多路由器实例冲突

### 现象

控制台警告：`Another router instance has already installed interceptors. Replacing with the new instance.`

### 原因

启用了 `interceptUniApi: true` 的路由器实例超过一个。拦截器是全局的，只能有一个活跃实例。

### 解决方案

**1. 确保单例**

```ts
// router/index.ts
let router: Router | null = null

export function useAppRouter() {
  if (!router) {
    router = createRouter({
      routes,
      interceptUniApi: true
    })
  }
  return router
}
```

**2. HMR 热更新时卸载**

```ts
// vite.config.ts
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeInterceptors()
  })
}
```

## 类型扩展不生效

### 现象

扩展 `RouteMeta` 后，TypeScript 未识别新字段。

### 排查

**1. 是否正确声明模块**

```ts
// types/router.d.ts
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteMeta {
    requireAuth?: boolean
    roles?: string[]
  }
}
```

**2. tsconfig 是否包含该文件**

```json
// tsconfig.json
{
  "include": ["src/**/*.ts", "src/types/**/*.d.ts"]
}
```

**3. 是否有多个冲突声明**

检查是否有多个文件声明了 `RouteMeta`，可能导致冲突。

## params 在 back 后丢失

### 现象

`router.back()` 后，目标页面的 `route.params` 为空。

### 原因

`back()` 返回原页面时，由于 `matcher.resolve` 在解析时移除了 `__params_key`，实际导航 URL 中不包含该 key，导致 `syncCurrentRoute` 无法从 URL 重建 params。

### 解决方案

::: tip 已修复
此问题在最新版本中已修复。`push` / `replace` 时实际导航 URL 会保留 `__params_key`（即使 `route.query` 中不可见），`back()` 返回时 `syncCurrentRoute` 会从 URL 读取 key 并用 `peek` 重建 params。**通常无需手动处理。**
:::

如果仍出现 params 丢失，可能是以下原因：

**1. 页面已被销毁**

`relaunch` 或栈溢出后，原页面被销毁，params 也被清理。

**2. 跨 relaunch 传递**

`relaunch` 会清空页面栈，params 无法保留。用全局状态：

```ts
// 发起页
const store = useDataStore()
store.setData(largeObject)
await router.relaunch({ name: 'target' })

// 目标页
const data = store.consumeData()
```

**3. TabBar 页面**

由于 `switchTab` 不支持 query，`__params_key` 无法传递，TabBar 页面无法接收 params。用全局状态替代。

## 守卫超时

### 现象

控制台报错：`Navigation guard timeout`。

### 原因

守卫中有耗时操作（如网络请求），超过默认超时时间（10 秒）。

### 解决方案

**1. 调大超时时间**

```ts
const router = createRouter({
  routes,
  guardTimeout: 30000 // 30 秒
})
```

**2. 优化守卫逻辑**

将耗时操作移到 `beforeResolve` 或页面 `onLoad` 中：

```ts
// ❌ beforeEach 中做耗时请求
router.beforeEach(async (to, from, next) => {
  await fetchLargeData() // 耗时
  next()
})

// ✅ 移到页面 onLoad
router.beforeEach((to, from, next) => {
  // 仅做快速检查
  next()
})

// 页面中
onLoad(async () => {
  await fetchLargeData()
})
```

## EventChannel 在 replace 中不可用

### 现象

`router.replace` 后，目标页面 `getOpenerEventChannel()` 返回 undefined。

### 原因

EventChannel 是 `navigateTo` 专属能力，`redirectTo` / `reLaunch` 不支持。

### 解决方案

**方案一（推荐）**：启用 `useUniEventChannel: true`，所有导航方式都支持内置通信通道：

```ts
const router = createRouter({
  routes,
  useUniEventChannel: true
})

// replace 后也能通信
const { eventChannel } = await router.replace({ name: 'target' })
eventChannel.emit('init', { payload })

// 目标页使用 usePageChannel() 接收
import { usePageChannel } from '@meng-xi/uni-router'
const channel = usePageChannel()
channel.on('init', (data) => { /* ... */ })
```

**方案二**：用全局状态替代：

```ts
// 发起页
const store = useCommStore()
store.setData(payload)
await router.replace({ name: 'target' })

// 目标页
const data = store.consumeData()
```

详见[实战指南 - 页面间通信](./recipes#页面间通信)。

## 路由跳转白屏

### 现象

调用 `router.push` 后，页面白屏。

### 排查

**1. 路由路径是否正确**

```ts
// ❌ 路径错误
await router.push({ path: 'about' }) // 缺少 pages/ 前缀

// ✅ 正确路径
await router.push({ path: 'pages/about/about' })
// 或用 name
await router.push({ name: 'about' })
```

**2. 页面是否在 pages.json 中注册**

uni-app 要求所有页面在 `pages.json` 中注册。未注册的页面无法跳转。

**3. 是否有 JS 错误**

检查目标页面的 `onLoad` / `setup` 是否有报错。

**4. 路由配置是否正确**

```ts
// ❌ path 与 pages.json 不一致
{ path: 'pages/about', name: 'about' } // 应为 pages/about/about

// ✅ 与 pages.json 一致
{ path: 'pages/about/about', name: 'about' }
```

## 动画不生效

### 现象

设置了 `animation: { type: 'fade-in' }`，但无动画效果。

### 原因

动画仅 App 端支持，H5 和小程序不支持。

### 解决方案

```ts
// 条件设置动画
// #ifdef APP-PLUS
await router.push({ name: 'about', animation: { type: 'fade-in', duration: 300 } })
// #endif

// #ifndef APP-PLUS
await router.push({ name: 'about' }) // 其他平台无动画
// #endif
```

详见[平台兼容性 - 导航动画](./compatibility#导航动画仅-app-支持)。

## 路由懒加载

### 现象

想按需加载页面组件，减少首屏体积。

### 说明

uni-app 的页面加载由 `pages.json` 配置决定，不支持 Vue Router 的 `() => import()` 懒加载语法。所有在 `pages.json` 中注册的页面都会被打包。

### 替代方案

**1. 分包加载**

```json
// pages.json
{
  "subPackages": [
    {
      "root": "subpkg",
      "pages": [
        { "path": "detail/detail", "style": { "navigationBarTitleText": "详情" } }
      ]
    }
  ]
}
```

**2. 路由配置中使用分包路径**

```ts
const routes: RouteConfig[] = [
  { path: 'subpkg/detail/detail', name: 'detail' }
]
```

## 仍无法解决？

如果以上都无法解决你的问题：

1. 查看 [API 文档](../api/create-router) 确认用法
2. 查看 [导航流程原理](./navigation-flow) 理解内部机制
3. 查看 [平台兼容性](./compatibility) 确认是否平台限制
4. 在 [GitHub Issues](https://github.com/MengXi-Studio/uni-router/issues) 提交问题，附上：
   - 复现步骤
   - 使用的平台（App / H5 / 小程序）
   - uni-app 版本和 Uni Router 版本
   - 完整的错误信息
