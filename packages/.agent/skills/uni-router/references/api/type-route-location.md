# RouteLocation

路由位置类型，描述导航的目标位置。是 `router.push()` / `router.replace()` / `router.relaunch()` 等导航方法和 `RouterLink` 组件 `to` 属性的核心类型。

## 输入类型：RouteLocationRaw

导航方法接受的是 `RouteLocationRaw`，支持字符串路径、路径对象或命名对象：

```ts
type RouteLocationRaw =
  | string
  | RouteLocationPathRaw
  | RouteLocationNamedRaw
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

## 字符串路径

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
- 无法指定 `animation` / `events` 等高级选项
- 推荐使用对象形式获得完整能力
:::

## RouteLocationPathRaw

通过 `path` 指定目标路径：

```ts
interface RouteLocationPathRaw {
  path: RoutePath
  query?: Record<string, QueryValue>
  params?: ParamsInput                        // （需 ParamsPlugin）
  persistent?: boolean                        // （需 ParamsPlugin）
  animation?: NavigationAnimation             // （需 AnimationPlugin）
  events?: EventListeners                     // （需 ChannelPlugin，仅 push 生效）
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

## RouteLocationNamedRaw

通过 `name` 指定命名路由：

```ts
interface RouteLocationNamedRaw {
  name: RouteName
  query?: Record<string, QueryValue>
  params?: ParamsInput                        // （需 ParamsPlugin）
  persistent?: boolean                        // （需 ParamsPlugin）
  animation?: NavigationAnimation             // （需 AnimationPlugin）
  events?: EventListeners                     // （需 ChannelPlugin，仅 push 生效）
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

::: info 插件依赖
`params`、`persistent`、`animation`、`events` 字段类型始终可用（提供完整类型提示），但运行时需要注册对应插件才生效。未注册插件时使用将抛出 `PLUGIN_REQUIRED` 错误。详见[插件系统](../guide/plugins)。
:::

### path / name

二选一，指定目标路由。`name` 优先于 `path`。

### query

- **类型**: `Record<string, QueryValue>`
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

- **类型**: `ParamsInput`
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

### animation

- **类型**: `NavigationAnimation`
- **说明**: 本次导航的动画配置，覆盖 `meta.animation`。App 端为原生窗口动画，H5 端通过 CSS 过渡实现（仅 `push` / `back` 生效）

```ts
await router.push({
  name: 'detail',
  animation: { type: 'slide-in-bottom', duration: 500 }
})
```

### events

- **类型**: `EventListeners`
- **说明**: EventChannel 事件监听器，用于目标页面向源页面通信（仅 push 生效）

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

## 解析后的类型：RouteLocation

导航完成后，`useRoute()` 返回的是解析后的 `RouteLocation` 对象：

```ts
interface RouteLocation {
  path: string
  name?: string
  meta: RouteMeta
  query: Record<string, string>
  params: Readonly<ParamObject>
  fullPath: string
  _synced?: boolean
  queryInt(key: string, defaultValue?: number): number | undefined
  queryNumber(key: string, defaultValue?: number): number | undefined
  queryBool(key: string, defaultValue?: boolean): boolean | undefined
}
```

### 特殊字段

#### fullPath

完整路径，包含 query：

```ts
const route = useRoute()
console.log(route.value.fullPath)
// /pages/detail/detail?id=1&tab=info
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

`RouteLocation` 提供 `queryInt` / `queryNumber` / `queryBool` 三个类型解析方法，从 query 中获取指定类型的数据。

### queryInt

将查询参数解析为整数：

```ts
const route = useRoute()

const id = route.value.queryInt('id')        // 123
const invalid = route.value.queryInt('name')  // undefined（无法解析或未提供默认值时）
const page = route.value.queryInt('page', 1)  // 带默认值，解析失败返回 1
```

### queryNumber

将查询参数解析为数值（支持浮点数）：

```ts
const route = useRoute()

const price = route.value.queryNumber('price')  // 99.99
```

### queryBool

将查询参数解析为布尔值：

```ts
const route = useRoute()

// 仅识别字符串 'true' / '1' → true，'false' / '0' → false
// 其他值（含数字 1 / 0、布尔 true / false）返回 defaultValue
const enabled = route.value.queryBool('enabled')          // true
const debug = route.value.queryBool('debug')              // false
const unknown = route.value.queryBool('other', false)     // false（无法识别时返回默认值）
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

// 安全访问（带默认值）
const page = route.value.queryInt('page', 1)
const size = route.value.queryInt('size', 20)
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

// 返回时反向动画（动画作为 back 的第二参数传入）
await router.back(1, {
  animation: { type: 'slide-out-bottom', duration: 300 }
})
```

### 导航方式控制

导航方式由调用方法决定：`router.replace()` 替换当前页，`router.relaunch()` 清空页面栈。如需在守卫重定向时指定导航方式，使用可控重定向：

```ts
// 登录成功后替换登录页（避免返回到登录页）
await router.replace({ name: 'home' })

// 退出登录后重启应用（清空页面栈）
await router.relaunch({ name: 'login' })

// 守卫中重定向时指定导航方式（可控重定向）
router.beforeEach((to, from) => {
  if (to.meta.requireAuth && !isLoggedIn()) {
    // 用 replace 跳转登录页，避免登录页残留在页面栈中
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  }
})
```

::: warning 导航方式不在 RouteLocationRaw 中
`RouteLocationRaw` 不包含 `mode` / `hash` 字段。强制替换或清栈请调用 `router.replace()` / `router.relaunch()`；守卫重定向时指定方式请使用可控重定向（`{ location, mode }`）。详见[路由守卫 - 可控重定向](../guide/guards#可控重定向)。
:::

## 下一步

- [useRoute()](./use-route) — 在组件中获取路由信息
- [Router 实例](./router-instance) — 导航方法详解
- [RouterLink 组件](../component/router-link) — 声明式导航
