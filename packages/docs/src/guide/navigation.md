# 路由导航

MengXi UniRouter 提供三种导航方式，分别对应 uni-app 的原生导航 API。

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

## back()

返回上一页或多级页面，对应 `uni.navigateBack`：

```ts
router.back()       // 返回上一页
router.back(2)      // 返回上两页
```

如果页面栈中不足 `delta` 个页面，会输出警告并立即 resolve，不会抛出错误：

```ts
await router.back(5)
// ⚠️ 警告：Cannot go back: no previous page in the navigation stack
```

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
