# 错误类型

路由错误相关的类型定义。

## RouterErrorCode

路由错误码枚举。

```ts
enum RouterErrorCode {
	NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
	NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
	NAVIGATION_DUPLICATED = 'NAVIGATION_DUPLICATED',
	ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
	NAVIGATION_API_ERROR = 'NAVIGATION_API_ERROR',
	SETUP_ERROR = 'SETUP_ERROR'
}
```

### 错误码说明

| 错误码                  | 值                        | 说明                                             |
| ----------------------- | ------------------------- | ------------------------------------------------ |
| `NAVIGATION_ABORTED`    | `'NAVIGATION_ABORTED'`    | 导航被守卫中止（`next(false)`）或守卫超时        |
| `NAVIGATION_CANCELLED`  | `'NAVIGATION_CANCELLED'`  | 导航被取消（守卫异常、重定向超限或页面栈不足）   |
| `NAVIGATION_DUPLICATED` | `'NAVIGATION_DUPLICATED'` | 重复导航到当前位置（路径、名称和查询参数均相同） |
| `ROUTE_NOT_FOUND`       | `'ROUTE_NOT_FOUND'`       | 未找到匹配的路由                                 |
| `NAVIGATION_API_ERROR`  | `'NAVIGATION_API_ERROR'`  | uni 导航 API 调用失败                            |
| `SETUP_ERROR`           | `'SETUP_ERROR'`           | 路由器初始化或使用方式错误                       |

## RouterError

路由错误基类。

```ts
class RouterError extends Error {
	readonly code: RouterErrorCode
	readonly message: string
}
```

### 属性

- **code**: 错误码
- **message**: 错误信息（自动添加 `[uni-router]` 前缀）

## NavigationFailure

导航失败类，继承自 `RouterError`。

```ts
class NavigationFailure extends RouterError {
	readonly to: RouteLocation
	readonly from: RouteLocation
	readonly cause?: unknown
}
```

### 属性

- **to**: 目标路由
- **from**: 来源路由
- **cause**: 原始错误原因，通常在 `NAVIGATION_API_ERROR` 时携带 uni API 调用失败的原始错误

## RouterOnError

路由错误处理回调类型。

```ts
type RouterOnError = (error: RouterError, to: RouteLocation, from: RouteLocation) => void
```

## 示例

```ts
import { RouterErrorCode, NavigationFailure } from '@meng-xi/uni-router'

try {
	await router.push({ name: 'about' })
} catch (error) {
	if (error instanceof NavigationFailure) {
		switch (error.code) {
			case RouterErrorCode.NAVIGATION_ABORTED:
				console.log('导航被中止')
				break
			case RouterErrorCode.NAVIGATION_DUPLICATED:
				console.log('重复导航')
				break
			case RouterErrorCode.NAVIGATION_API_ERROR:
				console.error('API 调用失败', error.cause)
				break
		}
	}
}
```
