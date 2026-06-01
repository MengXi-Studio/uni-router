# 错误处理

Uni Router 提供统一的错误处理机制，所有导航错误都使用 `NavigationFailure` 类封装，并附带结构化的错误码。

## 错误类型

### RouterError

路由错误基类，包含错误码和错误信息：

```ts
class RouterError extends Error {
	readonly code: RouterErrorCode
	readonly message: string
}
```

### NavigationFailure

导航失败类，继承自 `RouterError`，额外包含导航的来源和目标路由信息：

```ts
class NavigationFailure extends RouterError {
	readonly to: RouteLocation
	readonly from: RouteLocation
	readonly cause?: unknown
}
```

## 错误码

| 错误码                  | 说明             | 触发场景                       |
| ----------------------- | ---------------- | ------------------------------ |
| `NAVIGATION_ABORTED`    | 导航被守卫中止   | 守卫调用 `next(false)`         |
| `NAVIGATION_CANCELLED`  | 导航被取消       | 守卫抛出异常或重定向超限       |
| `NAVIGATION_DUPLICATED` | 重复导航         | `push()` 到当前已处于的页面    |
| `ROUTE_NOT_FOUND`       | 路由未找到       | 严格模式下使用未定义的命名路由 |
| `NAVIGATION_API_ERROR`  | uni API 调用失败 | `uni.navigateTo` 等调用失败    |
| `SETUP_ERROR`           | 初始化错误       | `useRouter()` 在 setup 外调用  |

## router.onError()

注册全局错误处理回调，所有导航错误都会触发：

```ts
const removeHandler = router.onError((error, to, from) => {
	switch (error.code) {
		case 'NAVIGATION_ABORTED':
			console.log('导航被中止')
			break
		case 'NAVIGATION_DUPLICATED':
			console.log('重复导航，忽略')
			break
		case 'NAVIGATION_API_ERROR':
			console.error('uni API 调用失败', error.cause)
			break
	}
})

// 移除处理器
removeHandler()
```

::: tip `onError` 中的异常不会影响其他错误处理器的执行。:::

## try-catch 处理

也可以在调用导航方法时使用 try-catch 捕获错误：

```ts
try {
	await router.push({ name: 'about' })
} catch (error) {
	if (error.code === 'NAVIGATION_DUPLICATED') {
		// 忽略重复导航
		return
	}
	if (error.code === 'NAVIGATION_ABORTED') {
		console.log('导航被守卫中止')
		return
	}
	throw error
}
```

## 常见错误处理场景

### 忽略重复导航

```ts
router.onError(error => {
	if (error.code === 'NAVIGATION_DUPLICATED') return
	console.error(error)
})
```

### 登录跳转

```ts
router.onError((error, to) => {
	if (error.code === 'NAVIGATION_ABORTED' && to.meta.requireAuth) {
		router.push({ name: 'login' })
	}
})
```

### uni API 失败重试

```ts
router.onError(async (error, to) => {
	if (error.code === 'NAVIGATION_API_ERROR') {
		console.error('导航失败，目标：', to.fullPath)
	}
})
```
