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
- [Hooks](#hooks)
- [组件](#组件)
	- [配置](#配置)
	- [Router 组件](#router组件)
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
- **Hooks**：
	- `useMxRouter`：获取 Router 实例
- **组件**：
	- `Router`：路由组件
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

## Hooks

### `useMxRouter` 用于管理 `Router` 组件实例并提供操作方法

注意：该 `Hook` 只支持 `vue3` 版本

```vue
<template>
	<mx-router @register="register">首页</mx-router>
</template>

<script setup lang="ts">
import { useMxRouter } from '@meng-xi/uni-router'

const [register, methods] = useMxRouter({
	to: '/pages/index/index'
})
</script>
```

#### 参数

| 属性                 | 描述                                              | 类型                                                                                    | 默认值     |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- |
| to                   | 路由地址                                          | RouterLinkProps                                                                         | -          |
| method               | 跳转方式                                          | 'push' \| 'replace' \| 'tab' \| 'launch' \| 'back' \| 'exit'                            | 'push'     |
| delta                | 回退层数                                          | number                                                                                  | -          |
| animationType        | 窗口动画类型                                      | UniApp.NavigateToOptions['animationType'] & UniApp.NavigateBackOptions['animationType'] | pop-in/out |
| animationDuration    | 动画持续时间                                      | number                                                                                  | 300        |
| renderLink           | 是否给 navigator 组件加一层 a 标签控制 ssr 渲染   | boolean                                                                                 | true       |
| hoverClass           | 自定义悬停样式类名                                | string                                                                                  | 'none'     |
| hoverStopPropagation | 指定是否阻止本节点的祖先节点出现点击态            | boolean                                                                                 | false      |
| hoverStartTime       | 按住后多久出现点击态，单位毫秒                    | number                                                                                  | 50         |
| hoverStayTime        | 手指松开后点击态保留时间，单位毫秒                | number                                                                                  | 600        |
| target               | 在哪个小程序目标上发生跳转，值域 self/miniProgram | string                                                                                  | 'self'     |

## 组件

### 配置

建议使用 `easycom` 来简化组件的引入和注册

#### NPM

```json
// pages.json
{
	"easycom": {
		"custom": {
			"^mx-(.*)": "@meng-xi/uni-router/components/$1/$1.vue"
		}
	}
}
```

#### HBuilderX

如果你是通过插件市场导入到 [`HBuilderX`](https://ext.dcloud.net.cn/plugin?id=24456) 的，需要修改一下组件路径

```json
// pages.json
{
	"easycom": {
		"custom": {
			"^mx-(.*)": "@/js_sdk/PedroQue99-router/PedroQue99-router/components/$1/$1.vue"
		}
	}
}
```

#### 配置全局组件类型

在 `vscode` 中使用时，为了有组件的类型提示和自动填充，需要配置全局组件类型声明。

```json
// tsconfig.json
{
	"compilerOptions": {
		"types": ["@meng-xi/uni-router/components/global"]
	}
}
```

如果是使用 `WebStorm`，可能需要在 main.ts 文件中导入 global.d.ts 文件。

```typescript
// main.ts
import '@meng-xi/uni-router/components/index.d.ts'
```

### Router 组件

#### 介绍

`Router` 组件用于在应用中进行路由导航。它提供了一种声明式的方式来定义路由链接和导航行为。

#### 引入

```typescript
import Router from '@meng-xi/uni-router/components/router/router.vue'
```

#### 基础用法

```vue
<template>
	<mx-router to="/pages/index/index">首页</mx-router>
</template>
```

#### API

##### RouterProps

| 属性                 | 描述                                              | 类型                                                                                    | 默认值     |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- |
| to                   | 路由地址                                          | RouterLinkProps                                                                         | -          |
| method               | 跳转方式                                          | 'push' \| 'replace' \| 'tab' \| 'launch' \| 'back' \| 'exit'                            | 'push'     |
| delta                | 回退层数                                          | number                                                                                  | -          |
| animationType        | 窗口动画类型                                      | UniApp.NavigateToOptions['animationType'] & UniApp.NavigateBackOptions['animationType'] | pop-in/out |
| animationDuration    | 动画持续时间                                      | number                                                                                  | 300        |
| renderLink           | 是否给 navigator 组件加一层 a 标签控制 ssr 渲染   | boolean                                                                                 | true       |
| hoverClass           | 自定义悬停样式类名                                | string                                                                                  | 'none'     |
| hoverStopPropagation | 指定是否阻止本节点的祖先节点出现点击态            | boolean                                                                                 | false      |
| hoverStartTime       | 按住后多久出现点击态，单位毫秒                    | number                                                                                  | 50         |
| hoverStayTime        | 手指松开后点击态保留时间，单位毫秒                | number                                                                                  | 600        |
| target               | 在哪个小程序目标上发生跳转，值域 self/miniProgram | string                                                                                  | 'self'     |

##### RouterSlots

| 插槽    | 描述           | 属性 |
| ------- | -------------- | ---- |
| default | 自定义默认内容 | -    |

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
