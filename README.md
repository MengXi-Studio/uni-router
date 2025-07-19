# @mengxi/uni-router

`@mengxi/uni-router` 是一款为 uni-app 量身打造的路由库，提供与 `vue-router` 高度相似的路由风格，同时附带实用工具函数，助力开发者高效实现多平台路由管理。

## 目录

- [功能特性](#功能特性)
- [安装](#安装)
- [快速开始](#快速开始)
  - [初始化路由实例](#初始化路由实例)
  - [添加全局守卫](#添加全局守卫)
  - [路由导航示例](#路由导航示例)
- [API 文档](#api-文档)
  - [MxRouter 类](#mxrouter-类)
  - [工具函数](#工具函数)
- [错误处理](#错误处理)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 功能特性

- **类 `vue-router` 风格**：熟悉的 API 设计，降低学习成本，让 `vue-router` 用户快速上手。
- **多导航方法**：支持 `push`、`replace`、`launch`、`tab`、`go`、`back` 等导航方式，满足不同场景跳转需求。
- **全局守卫机制**：
  - **前置守卫**：导航前执行，可用于权限验证、路由拦截。
  - **后置钩子**：导航成功后执行，可用于日志记录、页面统计。
- **工具函数**：提供 `parseLocation`、`buildUrl`、`getCurrentRoute` 等工具，简化路由操作。
- **多平台支持**：适配 H5、小程序、App 等 uni-app 支持的平台。

## 安装

使用 `pnpm` 进行安装：

```bash
pnpm install @mengxi/uni-router
```

## 快速开始

### 初始化路由实例

```typescript
import { MxRouter } from '@mengxi/uni-router'

// 初始化路由实例，可传入路由配置
const router = new MxRouter({
	routes: [
		{
			path: '/home',
			meta: { title: '首页' }
		},
		{
			path: '/admin',
			meta: { requiresAuth: true }
		}
	]
})
```

### 添加全局守卫

```typescript
// 模拟用户认证状态
const isAuthenticated = () => {
	// 这里可实现实际的认证逻辑
	return localStorage.getItem('token') !== null
}

// 全局前置守卫
router.beforeEach((to, from, next) => {
	if (to.meta?.requiresAuth && !isAuthenticated()) {
		next({ path: '/login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 全局后置钩子
router.afterEach((to, from) => {
	console.log(`成功从 ${from?.path || '初始页面'} 导航到 ${to.path}`)
})
```

### 路由导航示例

```typescript
// 跳转到新页面（保留当前页面）
router.push('/products')

// 带查询参数跳转
router.push({
	path: '/search',
	query: { keyword: '手机' }
})

// 替换当前页面
router.replace('/profile')

// 重新启动应用并跳转
router.launch('/dashboard')

// 切换到 tabBar 页面
router.tab('/tabBar/cart')

// 返回上一页
router.back()

// 返回指定页面数
router.go(-2)
```

## API 文档

### MxRouter 类

实现 `MxRouterInterface` 接口，提供以下核心方法：

#### 构造函数

```typescript
constructor(options: MxRouterOptions = {})
```

- **参数**：
  - `options`（可选）：包含 `routes` 路由配置数组的对象。

#### 导航方法

| 方法名      | 描述                                                             | 参数                                                               | 返回值          |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | --------------- |
| **push**    | 跳转到新页面，保留当前页面（可返回）                             | `location: RouteLocationRaw`（目标路由位置，支持字符串或对象格式） | `Promise<void>` |
| **replace** | 替换当前页面（不可返回，当前页面被替换）                         | `location: RouteLocationRaw`（目标路由位置，支持字符串或对象格式） | `Promise<void>` |
| **launch**  | 关闭所有页面并跳转到目标页（清空页面栈，无法返回）               | `location: RouteLocationRaw`（目标路由位置，支持字符串或对象格式） | `Promise<void>` |
| **tab**     | 切换到指定的 `tabBar` 页面（适用于底部导航栏切换）               | `location: RouteLocationRaw`（目标路由位置，支持字符串或对象格式） | `Promise<void>` |
| **go**      | 返回指定层数的上一个页面（`delta` 为负数表示后退，正数表示前进） | `delta: number = -1`（返回层数，默认 `-1` 表示上一页）             | `void`          |
| **back**    | 返回上一个页面，等同于 `go(-1)`                                  | 无                                                                 | `void`          |

#### 守卫与钩子

| 方法名         | 描述                                                           | 参数                                                                 | 返回值 |
| -------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| **beforeEach** | 添加全局前置守卫，在**导航触发前**执行（如权限校验、登录拦截） | `guard: NavigationGuard`（守卫函数，接收 `to`、`from`、`next` 参数） | `void` |
| **afterEach**  | 添加全局后置钩子，在**导航成功后**执行（如页面统计、日志记录） | `hook: AfterEachHook`（钩子函数，接收 `to`、`from` 参数）            | `void` |

#### 其他方法

| 方法名              | 描述                   | 参数 | 返回值                                           |
| ------------------- | ---------------------- | ---- | ------------------------------------------------ |
| **getCurrentRoute** | 获取当前页面的路由信息 | 无   | `Route \| null`（当前路由对象，失败返回 `null`） |

### 工具函数

`parseLocation`

```typescript
parseLocation(location: RouteLocationRaw): { path: string; query?: Record<string, string> }
```

- **描述**：解析路由位置信息，统一转换为路径和查询参数对象。
- **参数**：
  - location：路由位置信息，支持字符串或对象格式。
- **返回值**：包含 path 路径和可选 query 查询参数的对象。

`buildUrl`

```typescript
buildUrl(path: string, query?: Record<string, string | number | boolean>): string
```

- **描述**：根据路径和查询参数构建完整 URL。
- **参数**：
  - path：路径字符串。
  - query（可选）：查询参数对象。
- **返回值**：完整的 URL 字符串。

`getCurrentRoute`

```typescript
getCurrentRoute(currentPage: CurrentPage | null): Route | null
```

- **描述**：根据当前页面实例获取路由信息，支持多平台差异处理。
- **参数**：
  - currentPage：当前页面实例，可能为 null。
- **返回值**：当前路由对象，失败返回 null。

## 错误处理

`MxRouterError` 类用于处理路由错误，提供以下静态方法创建错误实例：

`navigationAborted`

```typescript
static navigationAborted(): MxRouterError
```

- **描述**：创建导航中止错误实例，用于前置守卫拦截导航的场景。
- **返回值**：导航中止错误实例。

`navigationRedirect`

```typescript
static navigationRedirect(location: string | RouteLocationRaw): MxRouterError
```

- **描述**：创建导航重定向错误实例，用于路由重定向场景。
- **参数**：
  - location：重定向后的路由位置。
- **返回值**：导航重定向错误实例。

`navigationFailed`

```typescript
static navigationFailed(message: string): MxRouterError
```

- **描述**：创建导航失败错误实例，用于导航过程中出现异常的场景。
- **参数**：
  - message：错误描述信息。
- **返回值**：导航失败错误实例。

`invalidMethod`

```typescript
static invalidMethod(method: string): MxRouterError
```

- **描述**：创建无效方法错误实例，用于调用无效导航方法的场景。
- **参数**：
  - method：无效的方法名。
- **返回值**：无效方法错误实例。

## 贡献指南

欢迎为 `@mengxi/uni-router` 贡献代码，步骤如下：

1. Fork 仓库：在 GitHub 上 Fork 本项目。
2. 克隆代码：将 Fork 后的项目克隆到本地。

```bash
git clone https://github.com/your-username/uni-router.git
cd uni-router
```

3. 创建分支：基于 main 分支创建新特性分支。

```bash
git checkout -b feature/your-feature
```

4. 提交更改：确保代码通过测试，提交清晰的 commit 信息。

```bash
git add .
git commit -m "feat: add your feature description"
```

5. 推送分支：将本地分支推送到 GitHub。

```bash
git push origin feature/your-feature
```

6. 创建 PR：在 GitHub 上创建 Pull Request，等待审核。

## 许可证

本项目采用 MIT 许可证。
