# 路由导航

Uni Router 提供四种导航方式，分别对应 uni-app 的原生导航 API。

## push()

导航到新页面。根据目标页面的 `meta.isTab` 自动选择 uni API：

- 普通页面 → `uni.navigateTo`
- TabBar 页面 → `uni.switchTab`

```ts
router.push('pages/about/about')
router.push({ path: 'pages/about/about' })
router.push({ path: 'pages/about/about', query: { id: '1' } })
router.push({ name: 'about' })
router.push({ name: 'about', query: { id: '1' } })
```

### 重复导航检测

当 `push()` 到与当前路径相同的页面时，会抛出 `NAVIGATION_DUPLICATED` 错误：

```ts
try {
	await router.push('/pages/index/index')
} catch (error) {
	if (error.code === 'NAVIGATION_DUPLICATED') {
		console.log('已在当前页面')
	}
}
```

::: tip
可通过 `router.onError()` 全局捕获此类错误，避免每次调用都需要 try-catch。
:::

### TabBar 页面注意事项

导航到 TabBar 页面时，`uni.switchTab` 不支持查询参数。如果传入了 query 参数，会输出警告并忽略：

```ts
router.push({ name: 'user', query: { tab: 'settings' } })
// ⚠️ 警告：uni.switchTab does not support query parameters. They will be ignored.
```

## replace()

替换当前页面。根据目标页面的 `meta.isTab` 自动选择 uni API：

- 普通页面 → `uni.redirectTo`
- TabBar 页面 → `uni.switchTab`

```ts
router.replace('pages/login/login')
router.replace({ name: 'login' })
router.replace({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: warning
替换到 TabBar 页面时，`uni.switchTab` 会关闭所有非 Tab 页面，而非仅替换当前页面。此行为由 uni-app 框架决定。
:::

## relaunch()

关闭所有页面并打开目标页面。根据目标页面的 `meta.isTab` 自动选择 uni API：

- 普通页面 → `uni.reLaunch`
- TabBar 页面 → `uni.switchTab`

常用于退出登录后跳转登录页、从深层页面返回首页、重置整个页面栈等场景。

```ts
router.relaunch('pages/index/index')
router.relaunch({ name: 'home' })
router.relaunch({ path: 'pages/login/login', query: { redirect: '/about' } })
```

::: info
`relaunch()` 不进行重复导航检测。因为清栈场景下目标页面可能就是当前页面（如"返回首页"），不应拒绝。
:::

::: warning
`uni.reLaunch` 不支持动画参数。如果传入了 animation 参数，会输出警告并忽略：

```ts
router.relaunch({ path: 'pages/index/index', animation: { type: 'fade-in' } })
// ⚠️ 警告：uni.reLaunch does not support animation parameters. The animation option will be ignored.
```
:::

## back()

返回上一页或多级页面，执行完整的导航守卫链，对应 `uni.navigateBack`：

```ts
router.back() // 返回上一页
router.back(2) // 返回上两页
router.back(1, { type: 'slide-out-right', duration: 500 }) // 返回并指定动画
```

### 守卫执行

`back()` 会执行完整的守卫链（`beforeEach` → `beforeResolve`），守卫可中止或重定向返回操作：

```ts
router.beforeEach((to, from, next) => {
	// 返回时也会触发守卫
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' }) // 重定向到登录页
	} else {
		next()
	}
})
```

### 错误处理

- 页面栈不足时抛出 `NavigationFailure`（`NAVIGATION_CANCELLED`）
- 守卫中止时抛出 `NavigationFailure`

```ts
try {
	await router.back()
} catch (error) {
	if (error.code === 'NAVIGATION_ABORTED') {
		console.log('返回被中止')
	}
}
```

::: warning
`back()` 仅拦截编程式调用。物理返回键和浏览器后退直接触发原生 `navigateBack`，
不经过路由器，守卫无法拦截。对于原生返回，需在页面 `onShow` 中调用
`router.syncRoute()` 同步状态。
:::

## RouteLocationRaw

导航方法接受三种形式的路由位置参数：

### 字符串路径

```ts
router.push('pages/about/about')
router.push('pages/about/about?id=1')
```

### 路径对象

```ts
router.push({ path: 'pages/about/about', query: { id: '1' } })
```

### 命名对象

```ts
router.push({ name: 'about', query: { id: '1' } })
```

## 并发导航

当存在未完成的导航时，新的导航请求会等待前一次导航完成后再执行：

```ts
router.push('/about')
router.push('/user')
// 第二次 push 会等第一次完成后再执行
```

## 页面间通信（EventChannel）

`push()` 支持 `events` 参数和 `eventChannel` 返回值，对应 uni-app 原生 `uni.navigateTo` 的 EventChannel 机制，实现页面间双向通信。仅 `push` 模式支持，`replace` / `relaunch` 传入 `events` 时会输出警告并忽略。

### 基本用法

```ts
// 页面 A：导航并监听被打开页面发来的事件
const { eventChannel } = await router.push({
	path: 'pages/detail/detail',
	query: { id: '1' },
	events: {
		// 监听被打开页面发来的 update 事件
		update(data) {
			console.log('收到更新:', data)
		}
	}
})

// 向被打开页面发送事件
eventChannel.emit('init', { message: '来自页面A的初始化数据' })
```

```ts
// 页面 B（detail）：获取 EventChannel 并通信
const instance = getCurrentInstance()
const eventChannel = instance.proxy.getOpenerEventChannel()

// 监听来自发起页面的 init 事件
eventChannel.on('init', (data) => {
	console.log('收到初始化数据:', data)
})

// 向发起页面发送 update 事件
eventChannel.emit('update', { result: '处理完成' })
```

### 类型定义

```ts
interface NavigationResult extends RouteLocation {
	eventChannel?: EventChannel
}

interface EventChannel {
	emit(event: string, ...args: any[]): EventChannel
	on(event: string, callback: (...args: any[]) => void): EventChannel
	once(event: string, callback: (...args: any[]) => void): EventChannel
	off(event: string, callback?: (...args: any[]) => void): EventChannel
}

type EventListeners = Record<string, (...args: any[]) => void>
```

### RouteLocationRaw 中的 events

```ts
interface RouteLocationPathRaw {
	path: string
	query?: Record<string, QueryValue>
	params?: ParamObject
	persistent?: boolean
	animation?: NavigationAnimation
	events?: EventListeners
}

interface RouteLocationNamedRaw {
	name: string
	query?: Record<string, QueryValue>
	params?: ParamObject
	persistent?: boolean
	animation?: NavigationAnimation
	events?: EventListeners
}
```

::: info
`NavigationResult` 继承自 `RouteLocation`，原有代码 `const route = await router.push(...)` 无需修改，`eventChannel` 为可选字段。
:::

## 页面参数传递（params）

`params` 用于传递不暴露在 URL 中的复杂数据（对象、数组等），支持 JSON 可序列化值。数据通过内部 Map 存储，目标页面通过 `route.params` 读取。

### 基本用法

```ts
// 导航时传递 params
await router.push({
	path: 'pages/detail/detail',
	query: { id: '1' }, // query 仍正常暴露在 URL 中
	params: { userInfo: { name: 'Tom', age: 20 }, tags: ['vip', 'active'] }
})

// 目标页面读取 params
const route = useRoute()
console.log(route.params.userInfo) // { name: 'Tom', age: 20 }
console.log(route.params.tags)     // ['vip', 'active']
```

### 持久化存储

默认 `params` 仅存储在内存中，页面关闭后数据丢失。设置 `persistent: true` 可将数据持久化到 `uni.setStorageSync`，H5 刷新后仍可读取。

```ts
// 单次导航持久化
await router.push({
	path: 'pages/detail/detail',
	params: { bigData: largeObject },
	persistent: true
})

// 全局默认持久化（所有 params 默认持久化）
const router = createRouter({
	routes: [...],
	paramsPersistent: true
})
```

::: warning
`params` 仅支持 JSON 可序列化值。传入不可序列化的值（如 `Date`、`Function`、`undefined`）时将输出警告，这些值在存储/读取过程中会丢失。
:::

### 参数清理

- **惰性清理**：读取 `params` 时，若对应页面已不在页面栈中，将自动删除该参数
- **同步清理**：调用 `syncRoute()` 时，会清理所有已不在页面栈中的参数
- **启动清理**：路由器初始化时，会清理所有残留的 `params`（包括 storage 中的数据）

## 查询参数增强

`RouteLocation` 提供三个便捷方法，自动解析 `query` 参数为指定类型：

### queryInt()

将查询参数解析为整数：

```ts
// URL: /pages/detail/detail?id=123
route.queryInt('id')           // 123
route.queryInt('page', 1)      // 1（默认值）
route.queryInt('invalid', 0)   // 0（解析失败时使用默认值）
```

### queryNumber()

将查询参数解析为数值（支持浮点数）：

```ts
// URL: /pages/detail/detail?price=19.99
route.queryNumber('price')         // 19.99
route.queryNumber('missing', 0)    // 0（默认值）
```

### queryBool()

将查询参数解析为布尔值：

```ts
// URL: /pages/detail/detail?enabled=true
route.queryBool('enabled')         // true
route.queryBool('visible', false)  // false（默认值）
```

识别规则：`'true'` / `'1'` → `true`，`'false'` / `'0'` → `false`，其他值 → 返回 `defaultValue`。

## 导航动画

导航动画仅 App 端生效，其他平台自动忽略。优先级：`调用时传入` > `meta.animation` > `uni 默认值`。

### 方式一：导航时传入动画

```ts
await router.push({ path: '/pages/about/about', animation: { type: 'slide-in-bottom' } })
await router.back(1, { type: 'slide-out-right', duration: 500 })
```

### 方式二：路由级默认动画

在路由配置中设置 `meta.animation`，该路由的所有导航将使用此动画作为默认值：

```ts
const routes = [
  {
    path: 'pages/about/about',
    name: 'about',
    meta: { animation: { type: 'fade-in', duration: 300 } }
  }
]
```

### 方式三：RouterLink 组件

```vue
<RouterLink to="pages/about/about" :animation="{ type: 'slide-in-bottom' }">
  <text>底部滑入</text>
</RouterLink>
```

### NavigationAnimation

```ts
interface NavigationAnimation {
  type: UniAnimationType
  duration?: number // 默认 300ms
}
```

### UniAnimationType

显示动画（navigateTo）：
- `slide-in-right` / `slide-in-left` / `slide-in-top` / `slide-in-bottom`
- `pop-in` / `fade-in` / `zoom-out` / `zoom-fade-out`
- `none` / `auto`

关闭动画（navigateBack）：
- `slide-out-right` / `slide-out-left` / `slide-out-top` / `slide-out-bottom`
- `pop-out` / `fade-out` / `zoom-in` / `zoom-fade-in`
- `none` / `auto`

::: info
动画类型对应 uni-app 的 `animationType` 参数，详见 [uni-app 导航动画文档](https://uniapp.dcloud.net.cn/api/router.html#animation)。
:::

## 导航与守卫

导航过程中会依次执行路由守卫，详见 [路由守卫](./guards) 章节。导航的完整流程为：

1. 解析路由位置
2. 重复导航检测（仅 push）
3. 执行全局前置守卫 `beforeEach`
4. 执行路由独享守卫 `beforeEnter`
5. 执行全局解析守卫 `beforeResolve`
6. 调用 uni 导航 API
7. 更新路由状态
8. 执行全局后置钩子 `afterEach`

::: info
`relaunch()` 同样走完整的守卫链，但跳过步骤 2（重复导航检测）。
:::
