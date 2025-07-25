# @meng-xi/uni-router

![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue&style=flat-square) ![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green&style=flat-square)
![GitHub](https://img.shields.io/github/license/MengXi-Studio/uni-router?color=orange&style=flat-square) ![GitHub Repo stars](https://img.shields.io/github/stars/MengXi-Studio/uni-router?style=social)

`@meng-xi/uni-router` 是一个专为 uni-app 开发的路由管理库，采用类似 `vue-router` 的设计风格，并提供丰富的工具函数，帮助开发者轻松实现跨平台路由管理。

## 目录

- [核心功能](#核心功能)
- [安装指南](#安装指南)
- [快速入门](#快速入门)
  - [实例化使用](#实例化使用)
  - [类使用](#类使用)
- [API 参考](#api-参考)
  - [Router 类](#router-类)
  - [实用工具](#实用工具)
- [错误处理](#错误处理)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 核心功能

- **类 `vue-router` API**：与 `vue-router` 相似的 API 设计，学习成本低，迁移简单
- **多种导航方式**：
  - `push`：保留当前页面的跳转
  - `replace`：替换当前页面
  - `launch`：重启应用并跳转
  - `tab`：切换 tabBar 页面
  - `go`/`back`：页面返回控制
- **路由守卫**：
  - `beforeEach`：导航前执行（适合权限验证）
  - `afterEach`：导航后执行（适合埋点统计）
- **实用方法**:
  - `getCurrentRoute`: 获取当前路由信息
  - `setCustomGetCurrentRoute`: 设置自定义获取当前路由的函数
- **实用工具**：
  - `parseLocation`：解析路由位置
  - `buildUrl`：构建完整 URL
  - `getCurrentRoute`：获取当前路由
- **全平台适配**：完美支持 H5、小程序和 App

## 安装指南

使用 `pnpm` 安装：

```bash
pnpm install @meng-xi/uni-router
```

## 快速入门

#### 初始化路由

```typescript
import { Router } from '@meng-xi/uni-router'

const router = new Router({
	routes: [
		{ path: '/home', meta: { title: '首页' } },
		{ path: '/admin', meta: { requiresAuth: true } }
	]
})
```

#### 配置路由守卫

```typescript
// 认证状态检查
const isAuthenticated = () => !!localStorage.getItem('token')

// 前置守卫
router.beforeEach((to, from, next) => {
	if (to.meta?.requiresAuth && !isAuthenticated()) {
		next({ path: '/login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 后置钩子
router.afterEach((to, from) => {
	console.log(`从 ${from?.path || '起始页'} 跳转到 ${to.path}`)
})
```

#### 路由跳转示例

```typescript
// 基本跳转
router.push('/products')

// 带参数跳转
router.push({
	path: '/search',
	query: { keyword: '手机' }
})

// 替换当前页
router.replace('/profile')

// 重启跳转
router.launch('/dashboard')

// 切换 tab 页
router.tab('/tabBar/cart')

// 页面返回
router.back()
router.go(-2)
```

### 单例模式

#### 创建单例

```typescript
import { Router } from '@meng-xi/uni-router'

Router.getInstance({
	routes: [
		{ path: '/home', meta: { title: '首页' } },
		{ path: '/admin', meta: { requiresAuth: true } }
	]
})
```

#### 守卫配置

```typescript
Router.beforeEach((to, from, next) => {
	if (to.meta?.requiresAuth && !isAuthenticated()) {
		next({ path: '/login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

Router.afterEach((to, from) => {
	console.log(`路由跳转: ${from?.path || '起始页'} → ${to.path}`)
})
```

#### 导航操作

```typescript
Router.push('/products')
Router.push({ path: '/search', query: { keyword: '手机' } })
Router.replace('/profile')
Router.launch('/dashboard')
Router.tab('/tabBar/cart')
Router.back()
Router.go(-2)
```

## API 参考

### Router 类

实现 `RouterInterface` 接口，提供核心路由功能。

#### 构造函数

```typescript
constructor(options?: RouterOptions)
```

参数说明：

- `options`（可选）：包含 `routes` 路由配置数组和 `customGetCurrentRoute` 自定义获取当前路由的函数的对象。

#### 导航方法

| 方法      | 说明                   | 参数                         | 返回值          |
| --------- | ---------------------- | ---------------------------- | --------------- |
| `push`    | 保留当前页面的跳转     | `location: RouteLocationRaw` | `Promise<void>` |
| `replace` | 替换当前页面           | `location: RouteLocationRaw` | `Promise<void>` |
| `launch`  | 重启应用跳转           | `location: RouteLocationRaw` | `Promise<void>` |
| `tab`     | 切换 tab 页面          | `location: RouteLocationRaw` | `Promise<void>` |
| `go`      | 返回指定层数（默认-1） | `delta?: number`             | `void`          |
| `back`    | 返回上一页             | -                            | `void`          |

#### 路由守卫

| 方法         | 说明         | 参数                     | 返回值 |
| ------------ | ------------ | ------------------------ | ------ |
| `beforeEach` | 全局前置守卫 | `guard: NavigationGuard` | `void` |
| `afterEach`  | 全局后置钩子 | `hook: AfterEachHook`    | `void` |

#### 实用方法

| 方法                       | 说明                         | 参数                                  | 返回值          |
| -------------------------- | ---------------------------- | ------------------------------------- | --------------- |
| `getCurrentRoute`          | 获取当前路由信息             | -                                     | `RouteLocation` |
| `setCustomGetCurrentRoute` | 设置自定义获取当前路由的函数 | `customFunction: () => Route \| null` | `void`          |

### 实用工具

#### `parseLocation`

```typescript
parseLocation(location: RouteLocationRaw): { path: string; query?: Record<string, string> }
```

- **功能**：将路由位置信息统一解析为路径和查询参数对象
- **参数**：
  - `location`：支持字符串或对象格式的路由位置信息
- **返回**：包含路径字符串和可选查询参数的对象

#### `buildUrl`

```typescript
buildUrl(path: string, query?: Record<string, string | number | boolean>): string
```

- **功能**：根据路径和查询参数构建完整 URL
- **参数**：
  - `path`：目标路径字符串
  - `query`（可选）：查询参数对象
- **返回**：完整的 URL 字符串

#### `getCurrentRoute`

```typescript
getCurrentRoute(currentPage: CurrentPage | null): Route | null
```

- **功能**：获取当前页面的路由信息（支持多平台差异处理）
- **参数**：
  - `currentPage`：当前页面实例（可为 null）
- **返回**：当前路由对象或 null（获取失败时）

## 错误处理

`MxRouterError`类提供以下静态方法创建错误实例：

#### `navigationAborted`

```typescript
static navigationAborted(): MxRouterError
```

- **用途**：创建导航中止错误（用于前置守卫拦截场景）
- **返回**：导航中止错误实例

#### `navigationRedirect`

```typescript
static navigationRedirect(location: string | RouteLocationRaw): MxRouterError
```

- **用途**：创建导航重定向错误（用于路由重定向场景）
- **参数**：
  - `location`：重定向目标位置
- **返回**：导航重定向错误实例

#### `navigationFailed`

```typescript
static navigationFailed(message: string): MxRouterError
```

- **用途**：创建导航失败错误（用于导航异常场景）
- **参数**：
  - `message`：错误描述信息
- **返回**：导航失败错误实例

#### `invalidMethod`

```typescript
static invalidMethod(method: string): MxRouterError
```

- **用途**：创建无效方法错误（用于调用非法导航方法场景）
- **参数**：
  - `method`：无效的方法名称
- **返回**：无效方法错误实例

## 贡献指南

欢迎为 `@meng-xi/uni-router` 贡献代码，步骤如下：

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

本项目采用 [MIT 许可证](https://github.com/MengXi-Studio/uni-router/blob/main/LICENSE)。
