# RouteLocation

路由位置类型，描述导航的目标位置。是 `router.push()` / `router.replace()` / `router.back()` 等导航方法和 `RouterLink` 组件 `to` 属性的核心类型。

## 类型定义

```ts
type RouteLocation =
  | string
  | RouteLocationPath
  | RouteLocationName
  | RouteLocationRaw
```

支持多种形式：

```ts
// 1. 字符串路径
router.push('/pages/about/about')

// 2. 路径对象
router.push({ path: 'pages/about/about' })

// 3. 命名路由
router.push({ name: 'about' })

// 4. 带参数
router.push({ path: 'pages/detail/detail', query: { id: '1' } })
router.push({ name: 'detail', params: { info: { id: 1 } } })
```

## 路径形式

### 字符串路径

最简单的形式，直接传递路径字符串：

```ts
// 基础路径
router.push('/pages/about/about')

// 带 query（自动解析）
router.push('/pages/detail/detail?id=1&name=Tom')

// 命名路由名称（不推荐，建议用 name 形式）
router.push('about')
```

::: warning 字符串路径的限制
- 路径需以 `/` 开头（自动补全）
- 无法传递 `params`（仅支持 query 字符串）
- 无法指定 `animation` / `events` / `mode` 等高级选项
- 推荐使用对象形式获得完整能力
:::

### RouteLocationPath

通过 `path` 指定目标路径：

```ts
interface RouteLocationPath {
  path: string
  query?: Record<string, any>
  params?: Record<string, any>
  hash?: string
  animation?: NavigationAnimation
  events?: Record<string, Function>
  mode?: NavigationMode
  persistent?: boolean
}
```

```ts
await router.push({
  path: 'pages/detail/detail',
  query: { id: '1', tab: 'info' },
  animation: { type: 'slide-in-right' },
  events: {
    onSelectAddress(data) {
      console.log('选择了地址:', data)
    }
  }
})
```

### RouteLocationName

通过 `name` 指定命名路由：

```ts
interface RouteLocationName {
  name: string
  query?: Record<string, any>
  params?: Record<string, any>
  hash?: string
  animation?: NavigationAnimation
  events?: Record<string, Function>
  mode?: NavigationMode
  persistent?: boolean
}
```

```ts
await router.push({
  name: 'detail',
  query: { id: '1' },
  params: { info: { id: 1, name: 'Tom' } }
})
```

::: tip 推荐使用命名路由
- **解耦**：路径变化不影响调用代码
- **类型安全**：配合 `@meng-xi/vite-plugin` 的 dts 功能，路由名有类型提示
- **可读性**：`{ name: 'detail' }` 比 `'/pages/detail/detail'` 更清晰
:::

## 属性详解

### path / name

二选一，指定目标路由。`name` 优先于 `path`。

### query

- **类型**: `Record<string, any>`
- **说明**: URL 查询参数，会被序列化为字符串拼接到 URL 后

::: warning query 的序列化限制
`query` 中的值会被 `encodeURIComponent` 序列化为字符串：
- 简单类型（string / number / boolean）正常传递
- 复杂对象会被序列化为 `[object Object]`，**无法还原**
- 数组会被序列化为逗号分隔字符串

传递复杂对象请使用 `params`。
:::

```ts
// ✅ 简单类型
router.push({ name: 'detail', query: { id: 123, tab: 'info' } })
// URL: /pages/detail/detail?id=123&tab=info

// ❌ 复杂对象（无法还原）
router.push({ name: 'detail', query: { user: { name: 'Tom' } } })
// URL: /pages/detail/detail?user=%5Bobject%20Object%5D
// 接收端：route.value.query.user === '[object Object]'

// ✅ 数组（会被序列化为字符串）
router.push({ name: 'detail', query: { ids: [1, 2, 3] } })
// URL: /pages/detail/detail?ids=1%2C2%2C3
// 接收端：route.value.query.ids === '1,2,3'（字符串）
```

### params

- **类型**: `Record<string, any>`
- **说明**: 页面参数，支持任意可序列化数据（对象、数组、嵌套结构）
- **存储方式**：
  - 默认存储在内存中（`persistent: false`）
  - 启用 `persistent: true` 后通过 `uni.setStorageSync` 持久化

```ts
// 传递复杂对象
await router.push({
  name: 'detail',
  params: {
    user: { name: 'Tom', age: 20 },
    tags: ['a', 'b', 'c'],
    meta: { source: 'home', timestamp: Date.now() }
  }
})

// 接收端
const route = useRoute()
const user = route.value.params.user  // { name: 'Tom', age: 20 }
const tags = route.value.params.tags  // ['a', 'b', 'c']
```

::: tip params vs query
| 特性 | query | params |
| --- | --- | --- |
| 类型限制 | 仅简单类型 | 任意可序列化数据 |
| URL 可见 | 是 | 否 |
| H5 刷新保留 | 是 | 仅 `persistent: true` |
| 大小限制 | URL 长度限制 | storage 容量 |
| 适用场景 | 简单参数、可分享 | 复杂数据、页面间通信 |
:::

### hash

- **类型**: `string`
- **说明**: URL hash 片段（仅 H5 生效）

```ts
router.push({ path: '/pages/about/about', hash: '#section-1' })
// URL: /pages/about/about#section-1
```

::: warning 平台限制
`hash` 仅 H5 平台支持。小程序和 App 端会忽略此参数。
:::

### animation

- **类型**: `NavigationAnimation`
- **说明**: 本次导航的动画配置（仅 App 端生效），覆盖 `meta.animation`

```ts
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 500 }
})
```

### events

- **类型**: `Record<string, Function>`
- **说明**: EventChannel 事件监听器，用于目标页面向源页面通信

```ts
// 源页面
await router.push({
  name: 'select-address',
  events: {
    onAddressSelected(address) {
      console.log('收到地址:', address)
      // 更新页面数据
      form.value.address = address
    }
  }
})

// 目标页面
const eventChannel = getCurrentInstance()?.proxy?.getOpenerEventChannel?.()
eventChannel?.emit('onAddressSelected', { city: '北京', detail: '朝阳区' })
```

::: tip EventChannel 的优势
- 跨页面通信无需全局状态或事件总线
- 自动清理：源页面关闭后事件自动失效
- 类型安全：可配合 TS 定义事件类型
:::

### mode

- **类型**: `'push' | 'replace' | 'relaunch'`
- **说明**: 导航方式（v1.7.0+），覆盖默认行为

```ts
// 强制替换（不保留当前页在栈中）
await router.push({ name: 'login', mode: 'replace' })

// 重启应用（清空页面栈）
await router.push({ name: 'home', mode: 'relaunch' })
```

::: tip mode 的应用场景
- `push`（默认）：常规导航，保留当前页
- `replace`：登录后跳转、表单提交后跳转，避免返回到表单页
- `relaunch`：退出登录、切换用户、回到首页，清空所有历史
:::

### persistent

- **类型**: `boolean`
- **说明**: 是否持久化 params，覆盖全局 `paramsPersistent` 配置

```ts
// 全局 paramsPersistent: false，单次持久化
await router.push({
  name: 'detail',
  params: { id: 123 },
  persistent: true  // 本次持久化
})

// 全局 paramsPersistent: true，单次不持久化
await router.push({
  name: 'detail',
  params: { id: 123 },
  persistent: false  // 本次不持久化
})
```

## RouteLocationNormalized

导航完成后，`route` 对象中存储的是规范化后的路由位置：

```ts
interface RouteLocationNormalized {
  path: string
  name?: string
  query: Record<string, string>
  params: Record<string, any>
  hash: string
  fullPath: string
  meta: RouteMeta
  matched: RouteConfig[]
  redirectedFrom?: RouteLocationNormalized
  _synced?: boolean
}
```

### 特殊字段

#### fullPath

完整路径，包含 query 和 hash：

```ts
const route = useRoute()
console.log(route.value.fullPath)
// /pages/detail/detail?id=1&tab=info#section-1
```

#### matched

匹配的路由配置链（嵌套路由时会有多个）：

```ts
const route = useRoute()
route.value.matched.forEach((config, index) => {
  console.log(`匹配层级 ${index}:`, config.path)
})
```

#### redirectedFrom

如果本次导航是由守卫重定向触发的，记录原始目标：

```ts
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.redirectedFrom) {
    console.log(`从 ${to.redirectedFrom.fullPath} 重定向到 ${to.fullPath}`)
  }
})
```

#### _synced

标记本次路由变化是否为"状态同步"（非完整导航）：

```ts
router.onRouteChange((to, from) => {
  if (to._synced) {
    // 状态同步：如物理返回键、TabBar 点击
    console.log('状态同步，非主动导航')
  } else {
    // 完整导航：push / replace / back 等
    console.log('完整导航')
  }
})
```

::: tip _synced 的应用
- 物理返回键触发时，路由状态会同步但 `_synced` 为 `true`
- TabBar 点击切换时，`_synced` 也为 `true`
- 可用于区分主动导航和被动状态变化，决定是否执行某些副作用
:::

## 类型解析方法

`RouteLocationNormalized` 提供了一系列类型解析方法，方便从 query / params 中获取指定类型的数据：

### queryInt / paramInt

将参数解析为整数：

```ts
const route = useRoute()

// query 解析
const id = route.value.queryInt('id')        // 123
const invalid = route.value.queryInt('name')  // NaN（无法解析时返回 NaN）

// params 解析
const count = route.value.paramInt('count')   // 10
```

### queryNumber / paramNumber

将参数解析为数值（支持浮点数）：

```ts
const route = useRoute()

const price = route.value.queryNumber('price')    // 99.99
const discount = route.value.paramNumber('discount')  // 0.85
```

### queryBool / paramBool

将参数解析为布尔值：

```ts
const route = useRoute()

// 支持的 truthy 值：'true' / '1' / 1 / true
// 支持的 falsy 值：'false' / '0' / 0 / false / undefined / null
const enabled = route.value.queryBool('enabled')   // true
const debug = route.value.paramBool('debug')       // false
```

### queryJSON / paramJSON

将参数解析为 JSON 对象：

```ts
const route = useRoute()

// query 中的 JSON 字符串
const filter = route.value.queryJSON('filter')
// query: ?filter={"category":"book","price":{"min":10,"max":100}}
// 解析后：{ category: 'book', price: { min: 10, max: 100 } }

// params 中的 JSON 字符串
const config = route.value.paramJSON('config')
```

### 实战示例

```vue
<script setup lang="ts">
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 从 query 解析多种类型
const id = route.value.queryInt('id')              // 整数 ID
const price = route.value.queryNumber('price')     // 浮点价格
const enabled = route.value.queryBool('enabled')   // 布尔开关
const filter = route.value.queryJSON('filter')     // 复杂对象

// 从 params 解析
const user = route.value.paramJSON('user')         // 用户对象
const tags = route.value.paramJSON('tags')         // 标签数组

// 安全访问（带默认值）
const page = route.value.queryInt('page') || 1
const size = route.value.queryInt('size') || 20
</script>
```

## 完整示例

### 基础导航

```ts
// 字符串路径
await router.push('/pages/about/about')

// 命名路由
await router.push({ name: 'about' })

// 带参数
await router.push({ name: 'detail', query: { id: '1' } })
```

### 复杂数据传递

```ts
// 传递复杂对象
await router.push({
  name: 'detail',
  params: {
    user: { name: 'Tom', age: 20 },
    items: [
      { id: 1, name: '商品A', price: 99.9 },
      { id: 2, name: '商品B', price: 199.9 }
    ]
  },
  persistent: true  // 持久化，H5 刷新后仍可读取
})
```

### 跨页面通信

```ts
// 源页面：打开选择器并监听结果
await router.push({
  name: 'select-address',
  events: {
    onSelected(address) {
      form.value.address = address
    },
    onCancel() {
      console.log('用户取消选择')
    }
  }
})

// 目标页面：发送结果
const instance = getCurrentInstance()
const channel = instance?.proxy?.getOpenerEventChannel?.()

function selectAddress(address) {
  channel?.emit('onSelected', address)
  router.back()
}

function cancel() {
  channel?.emit('onCancel')
  router.back()
}
```

### 自定义动画

```ts
// 从底部滑入（详情页常用）
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 300 }
})

// 淡入效果（弹窗式页面）
await router.push({
  name: 'modal',
  animation: { type: 'fade-in', duration: 200 }
})

// 返回时反向动画
await router.back({
  animation: { type: 'slide-out-bottom', duration: 300 }
})
```

### 导航方式控制

```ts
// 登录成功后替换登录页（避免返回到登录页）
await router.push({ name: 'home', mode: 'replace' })

// 退出登录后重启应用
await router.push({ name: 'login', mode: 'relaunch' })

// 守卫中重定向时指定方式
router.beforeEach((to, from, next) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    next({ name: 'login' }, { mode: 'replace' })  // 替换，避免返回到受保护页
  } else {
    next()
  }
})
```

## 下一步

- [useRoute()](./use-route) — 在组件中获取路由信息
- [Router 实例](./router-instance) — 导航方法详解
- [RouterLink 组件](./router-link) — 声明式导航
