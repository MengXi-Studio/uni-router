# 路由守卫

Uni Router 提供完整的路由守卫机制，允许在导航过程中进行拦截、校验和重定向。

## 守卫类型

| 守卫            | 注册方式                 | 执行时机         | 可否中止 | 可否重定向 |
| --------------- | ------------------------ | ---------------- | -------- | ---------- |
| `beforeEach`    | `router.beforeEach()`    | 导航前           | ✅       | ✅         |
| `beforeEnter`   | RouteConfig 中定义       | beforeEach 之后  | ✅       | ✅         |
| `beforeResolve` | `router.beforeResolve()` | 所有前置守卫之后 | ✅       | ✅         |
| `afterEach`     | `router.afterEach()`     | 导航完成后       | ❌       | ❌         |

## beforeEach

全局前置守卫，在每次导航前执行。常用于权限校验、登录检查等：

```ts
const removeGuard = router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login' })
	} else {
		next()
	}
})

// 移除守卫
removeGuard()
```

### next() 调用方式

- `next()` — 放行导航
- `next(false)` — 中止导航
- `next(location)` — 重定向到新位置

::: warning每个守卫必须且只能调用一次 `next()`。多次调用或未调用都会导致导航挂起。如果守卫在超时时间内（默认 10 秒，可通过 `guardTimeout` 配置）既未调用 `next()` 也未返回 rejected Promise，将自动中止导航并输出警告。:::

### 异步守卫

守卫函数支持异步操作：

```ts
router.beforeEach(async (to, from, next) => {
	const isAuth = await checkAuthStatus()
	if (to.meta.requireAuth && !isAuth) {
		next({ name: 'login' })
	} else {
		next()
	}
})
```

::: tip 如果守卫中的异步操作耗时较长（如网络请求），可通过 `guardTimeout` 选项调大超时时间，避免误判为超时。:::

## beforeEnter

路由独享守卫，定义在 `RouteConfig` 中，仅在进入该路由时触发：

### 单个守卫

```ts
const routes = [
	{
		path: 'pages/admin/admin',
		name: 'admin',
		beforeEnter: (to, from, next) => {
			if (isAdmin()) {
				next()
			} else {
				next(false)
			}
		}
	}
]
```

### 多个守卫

```ts
const routes = [
	{
		path: 'pages/admin/admin',
		name: 'admin',
		beforeEnter: [checkAuthGuard, checkAdminGuard]
	}
]
```

多个守卫按顺序执行，任一守卫中止或重定向则后续守卫不再执行。

## beforeResolve

全局解析守卫，在所有前置守卫和路由独享守卫完成后执行。适合在导航最终确认前进行操作：

```ts
router.beforeResolve((to, from, next) => {
	// 所有前置守卫已通过，导航即将执行
	next()
})
```

## afterEach

全局后置钩子，在导航完成后执行。无法中止导航，适合进行日志记录、页面标题设置等：

```ts
router.afterEach((to, from) => {
	if (to.meta.title) {
		uni.setNavigationBarTitle({ title: to.meta.title as string })
	}
})
```

::: tip `afterEach` 中的异常不会影响导航结果，但应避免在钩子中抛出错误。:::

## 守卫执行顺序

一次完整的导航流程中，守卫的执行顺序如下：

```
push('/about')
  │
  ├─ 1. beforeEach（全局前置守卫）
  │     ├─ 守卫 A → next()
  │     └─ 守卫 B → next()
  │
  ├─ 2. beforeEnter（路由独享守卫）
  │     ├─ 守卫 C → next()
  │     └─ 守卫 D → next()
  │
  ├─ 3. beforeResolve（全局解析守卫）
  │     └─ 守卫 E → next()
  │
  ├─ 4. uni.navigateTo() / uni.switchTab()
  │
  └─ 5. afterEach（全局后置钩子）
        └─ 钩子 F
```

## 重定向

在守卫中调用 `next(location)` 可重定向到新位置，触发新的导航流程：

```ts
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})
```

::: warning 重定向会触发新的导航流程，包括重新执行所有守卫。为防止无限循环，最大重定向深度为 10 次。超过限制时导航将被取消并抛出 `NAVIGATION_CANCELLED` 错误。:::

## 中止导航

在守卫中调用 `next(false)` 可中止当前导航：

```ts
router.beforeEach((to, from, next) => {
	if (isMaintenanceMode()) {
		next(false)
	} else {
		next()
	}
})
```

中止导航时会抛出 `NAVIGATION_ABORTED` 错误，可通过 `router.onError()` 捕获。

## 拦截 uni 原生导航 API

默认情况下，直接调用 `uni.navigateTo()`、`uni.redirectTo()` 等原生 API 会绕过路由守卫。通过启用 `interceptUniApi` 选项，可以拦截这些调用并转由路由器处理：

```ts
const router = createRouter({
  routes: [...],
  interceptUniApi: true
})
```

启用后，以下调用将被拦截并走完整的守卫链：

```ts
// 以下调用会被拦截，自动转为 router.push({ path: '/pages/about/about', query: { id: '1' } })
uni.navigateTo({ url: '/pages/about/about?id=1' })

// 以下调用会被拦截，自动转为 router.replace({ path: '/pages/about/about' })
uni.redirectTo({ url: '/pages/about/about' })

// 以下调用会被拦截，自动转为 router.push('/pages/user/user')
uni.switchTab({ url: '/pages/user/user' })

// 以下调用会被拦截，自动转为 router.back(1)
uni.navigateBack({ delta: 1 })
```

::: warning 启用拦截后，直接调用 uni 原生 API 的 `success` / `fail` 回调将不会被触发。建议统一使用 `router.push()` / `router.replace()` / `router.back()` 进行导航。:::

## 守卫异常处理

如果守卫函数抛出异常或返回 rejected Promise，导航将被取消：

```ts
router.beforeEach(async (to, from, next) => {
	try {
		await someAsyncOperation()
		next()
	} catch (error) {
		// 异常会导致导航被取消（NAVIGATION_CANCELLED）
		next(false)
	}
})
```
