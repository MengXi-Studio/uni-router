# RouteLocation

解析后的路由位置信息。

## 类型定义

```ts
interface RouteLocation {
	path: string
	name?: string
	meta: RouteMeta
	query: Record<string, string>
	fullPath: string
	_synced?: boolean
}
```

## 属性

### path

- **类型**: `string`
- **说明**: 规范化后的路径（以 `/` 开头）

### name

- **类型**: `string | undefined`
- **说明**: 路由名称，未配置名称的路由为 `undefined`

### meta

- **类型**: [`RouteMeta`](./type-route-meta)
- **说明**: 路由元信息，未配置时为空对象 `{}`

### query

- **类型**: `Record<string, string>`
- **说明**: 查询参数键值对，无参数时为空对象 `{}`

### fullPath

- **类型**: `string`
- **说明**: 完整路径（含查询参数），如 `/pages/about/about?id=1`。查询参数按键名字母序排列，确保相同参数生成一致的 fullPath。

### \_synced

- **类型**: `boolean | undefined`
- **说明**: 是否为状态同步（非完整导航）。当路由状态通过 `syncRoute()` / `syncCurrentRoute()` 从页面栈同步时设为 `true`。正常导航完成时此字段为 `undefined` 或 `false`。

::: warning
`_synced` 为内部标记，不应在应用代码中依赖此字段。如需区分完整导航和状态同步，
可在 `onRouteChange` 监听器中检查此字段。
:::

## 相关类型

### RouteLocationRaw

原始路由位置，导航方法接受的参数类型：

```ts
type RouteLocationRaw = string | RouteLocationPathRaw | RouteLocationNamedRaw
```

### RouteLocationPathRaw

基于路径的原始路由位置：

```ts
interface RouteLocationPathRaw {
	path: string
	query?: Record<string, string>
	animation?: NavigationAnimation
	events?: EventListeners
}
```

### RouteLocationNamedRaw

基于名称的原始路由位置：

```ts
interface RouteLocationNamedRaw {
	name: string
	query?: Record<string, string>
	animation?: NavigationAnimation
	events?: EventListeners
}
```

### NavigationResult

`push()` 方法的返回类型，继承自 `RouteLocation`，额外包含页面间通信的 `eventChannel`：

```ts
interface NavigationResult extends RouteLocation {
	eventChannel?: EventChannel
}
```

- **eventChannel**: 页面间通信事件通道，仅在 `push` 模式下可用。`replace` / `relaunch` 返回时此字段为 `undefined`

::: info
`NavigationResult` 继承自 `RouteLocation`，原有代码 `const route = await router.push(...)` 无需修改。
:::

### EventChannel

页面间通信事件通道，对应 uni-app 原生 `uni.navigateTo` 的 EventChannel 机制：

```ts
interface EventChannel {
	emit(event: string, ...args: any[]): EventChannel
	on(event: string, callback: (...args: any[]) => void): EventChannel
	once(event: string, callback: (...args: any[]) => void): EventChannel
	off(event: string, callback?: (...args: any[]) => void): EventChannel
}
```

- **emit**: 向对端页面发送事件
- **on**: 监听对端页面发来的事件
- **once**: 监听对端页面发来的事件（仅触发一次）
- **off**: 取消监听事件

::: tip
所有方法均返回 `EventChannel` 实例，支持链式调用。
:::

### EventListeners

事件监听器集合，用于 `RouteLocationPathRaw` 和 `RouteLocationNamedRaw` 的 `events` 字段：

```ts
type EventListeners = Record<string, (...args: any[]) => void>
```

::: info
源码中 `path` 的类型为 `RoutePath`，`name` 的类型为 `RouteName`，它们通过 `RouteNameMap` 接口提供类型提示。
当使用 `@meng-xi/vite-plugin` 的 `dts` 功能生成类型声明后，`name` 和 `path` 将获得自动补全和类型检查。
未增强时，两者均回退为 `string`。
:::

## 示例

```ts
const location = router.resolve({ name: 'about', query: { id: '1' } })
// {
//   path: '/pages/about/about',
//   name: 'about',
//   meta: { requireAuth: true },
//   query: { id: '1' },
//   fullPath: '/pages/about/about?id=1'
// }
```
