# 常用代码模式库

从 `guide/recipes.md`、`guide/guards.md`、`guide/navigation.md` 与 `packages/playground` 提炼的可直接抄写方案。
**复制后请按项目的路由命名（`'home'` vs `'pagesIndexIndex'`）调整**。完整版见 `guide/recipes.md`。

## 1. 登录认证（最常用）

```ts
router.beforeEach((to, from) => {
  const logged = !!uni.getStorageSync('token')
  if (to.meta.requireAuth && !logged)
    return { location: { name: 'login', query: { redirect: to.fullPath } }, mode: 'replace' }
  if (to.name === 'login' && logged)
    return { name: 'home' }
})
```

登录页回跳：`const redirect = route.query.redirect as string; redirect ? router.replace(redirect) : router.relaunch({ name: 'home' })`。
用 `mode: 'replace'` 避免登录页残留在栈中形成"未登录中间态"。开 `interceptUniApi` 防止 `uni.navigateTo` 绕过。

## 2. 角色 / 权限

```ts
// types/router.d.ts 先扩展 meta：roles?: string[]; permissions?: string[]
router.beforeEach((to) => {
  const roles = to.meta.roles
  if (roles?.length && !roles.some(r => userStore.roles.includes(r)))
    return { name: 'forbidden' }
  const perms = to.meta.permissions
  if (perms?.length && !perms.every(p => userStore.permissions.includes(p)))
    return { name: 'forbidden' }
})
```

## 3. 表单离开确认（返回守卫）

```ts
export function useDirtyGuard(dirty: Ref<boolean>) {
  const router = useRouter()
  return router.onBeforeBack(() => {
    if (!dirty.value) return
    return new Promise<boolean>((resolve) => {
      uni.showModal({ title: '提示', content: '有未保存的修改，确认离开？',
        success: (res) => resolve(res.confirm) })
    })
  })
}
// 页面里：const remove = useDirtyGuard(dirty); onUnmounted(remove)
```

返回 `false` 阻止，`true` / `undefined` 放行，支持异步。⚠️ 小程序原生返回拦不住（见 `troubleshooting.md`）。

## 4. 离开确认（组件内 `onBeforeRouteLeave`）

```ts
onBeforeRouteLeave((to, from) => hasUnsaved.value ? false : undefined)
```
内部基于 `beforeEach`，**组件卸载时自动移除**；仅拦截由路由器发起的前进导航。

## 5. 页面间通信：原生 EventChannel（默认）

```ts
// A 页
const { eventChannel } = await router.push({
  name: 'detail',
  events: { refresh: (data) => console.log(data) }   // 先注册再导航，可收粘性事件
})
eventChannel.emit('done', { id: 1 })

// B 页
const channel = usePageChannel()   // 需 ChannelPlugin + useUniEventChannel
channel?.emit('refresh', { id: 1 })
channel?.on('done', (data) => {})
```

⚠️ 默认只有 `push` 有 `eventChannel`；`useUniEventChannel: true` 后 `replace`/`relaunch`/`back` 都能通信。

## 6. 传复杂对象：params

```ts
await router.push({ name: 'detail', params: { user, list }, persistent: true })  // persistent 需 ParamsPlugin
// 目标页
const route = useRoute()
route.value.params.user   // 首读用 get（读完即删）；back 回来用 peek 重建
```

不支持函数 / Symbol；默认内存态，H5 刷新丢失 → 加 `persistent: true` 或全局 `paramsPersistent: true`。

## 7. 向 TabBar 页面传数据（switchTab 无 query）

```ts
// 发送方
tabStore.setTabParam('user', { scrollTarget: 'orders' })
await router.push({ name: 'user' })

// TabBar 页
onShow(() => {
  router.syncRoute()
  const p = tabStore.getTabParam('user')
  if (p?.scrollTarget) { scrollTo(p.scrollTarget); tabStore.clearTabParam('user') }
})
```

**不要用 `params` 传给 TabBar 页** —— `switchTab` 不支持 query，`__params_key` 传不过去。

## 8. 冷启动补守卫

```ts
onLaunch((options) => {
  router.isReady().then(() => {
    const launchPath = options?.path ? `/${options.path}` : undefined
    router.guardRoute(launchPath, {                       // ← 第一个参数是 location
      onAbort: () => router.relaunch({ name: 'home' })    // 冷启动无法真正阻止进入，只能事后跳走
    })
  })
})
```

## 9. 页面标题自动设置

```ts
router.afterEach((to) => uni.setNavigationBarTitle({ title: to.meta.title || '默认标题' }))
```

## 10. 埋点（导航 + 状态同步全覆盖）

```ts
router.afterEach((to, from) => track(to.path, from.path, false))
router.onRouteChange((to, from) => { if (to._synced) track(to.path, from.path, true) })
```
`afterEach` **不覆盖**物理返回/浏览器后退造成的状态同步，必须配 `onRouteChange` + `_synced`。

## 11. 页面栈安全导航（小程序 10 层上限）

```ts
async function safePush(location: RouteLocationRaw) {
  if (getCurrentPages().length >= 8) await router.relaunch(location)  // 预留 2 层缓冲
  else await router.push(location)
}
async function safeBack(delta = 1, fallback: RouteLocationRaw = { name: 'home' }) {
  try { await router.back(delta) }
  catch { await router.relaunch(fallback) }   // 栈不足会抛 NAVIGATION_CANCELLED
}
```

## 12. 参数读取与类型转换

```ts
const route = useRoute()
route.value.queryInt('page', 1)      // 另有 queryNumber() / queryBool()，都带默认值
route.value.query.id                 // 原始字符串
```

## 13. 导航动画

```ts
await router.push({ name: 'detail', animation: { type: 'slide-in-right', duration: 300 } })
await router.back(1, { animation: { type: 'fade-out' } })   // 需 AnimationPlugin
```
`reLaunch` 不支持动画（传入会告警）。完整 `UniAnimationType` 取值见 `api/type-route-meta.md`。

## 14. 自定义导航组件（useLink）

```ts
const { href, isActive, isExactActive, navigate } = useLink({ to: { name: 'about' } })
```

## 15. 组件外使用（Pinia / 工具函数）

直接 `import router from '@/router'`；**不要在组件外调 `useRouter()`**（抛 `SETUP_ERROR`）。
