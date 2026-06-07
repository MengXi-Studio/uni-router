# @meng-xi/uni-router

[![license](https://img.shields.io/github/license/MengXi-Studio/uni-router.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/uni-router?color=blue)](https://www.npmjs.com/package/@meng-xi/uni-router)
![npm](https://img.shields.io/npm/dt/@meng-xi/uni-router?color=green)

为 uni-app 提供类似 vue-router 风格的路由管理系统（uni_modules 版本）。

---

## 特性

- **vue-router 风格 API** - 熟悉的 `push` / `replace` / `back` 导航方式，零学习成本
- **路由守卫** - 全局前置守卫 `beforeEach`、解析守卫 `beforeResolve`、后置钩子 `afterEach`、路由独享守卫 `beforeEnter`
- **命名路由** - 通过 `name` 进行导航，无需硬编码路径字符串
- **路由元信息** - `meta` 字段支持页面标题、权限标记、TabBar 标识等自定义数据
- **TypeScript 类型提示** - 通过模块增强为路由名称和路径提供自动补全和类型检查
- **错误处理** - 完整的 `RouterError` / `NavigationFailure` 体系，支持 `onError` 全局捕获
- **组合式 API** - `useRouter()` / `useRoute()` 在组件中便捷访问路由器
- **uni_modules 集成** - 通过 uni_modules 方式安装，无需 npm，开箱即用

📖 **完整文档：[https://mengxi-studio.github.io/uni-router/](https://mengxi-studio.github.io/uni-router/)**

## 安装

### uni_modules（推荐）

将 `mxuni-router` 目录复制到项目的 `uni_modules` 目录下：

```
src/
  └── uni_modules/
        └── mxuni-router/
              ├── js_sdk/
              │     ├── index.js
              │     ├── index.cjs
              │     ├── index.d.ts
              │     └── index.d.cts
              ├── components/
              │     └── mxuni-router/
              │           └── mxuni-router.vue
              ├── package.json
              └── readme.md
```

### npm

```bash
pnpm add @meng-xi/uni-router
```

> npm 方式需将导入路径改为 `@meng-xi/uni-router`。

## 快速开始

### 1. 创建路由器

```typescript
// main.ts
import { createSSRApp } from 'vue'
import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import App from './App.vue'

const router = createRouter({
	routes: [
		{ path: 'pages/index/index', name: 'home', meta: { title: '首页' } },
		{ path: 'pages/about/about', name: 'about', meta: { title: '关于', requireAuth: true } },
		{ path: 'pages/user/user', name: 'user', meta: { title: '我的', isTab: true } }
	],
	strict: true
})

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
```

### 2. 路由导航

```typescript
import { useRouter, useRoute } from './uni_modules/mxuni-router/js_sdk/index.js'

// 在组件 setup 中使用
const router = useRouter()
const route = useRoute()

// 路径导航
await router.push('/pages/about/about')
await router.push({ path: '/pages/about/about', query: { id: '1' } })

// 命名导航
await router.push({ name: 'about' })

// 返回
await router.back()
await router.back(2) // 返回两级
```

### 3. 路由守卫

```typescript
// 全局前置守卫 - 登录验证
router.beforeEach((to, from, next) => {
	if (to.meta.requireAuth && !isLoggedIn()) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

// 全局后置钩子
router.afterEach((to, from) => {
	console.log(`导航完成: ${from.path} → ${to.path}`)
})
```

### 4. 自动生成路由配置（推荐）

配合 [`@meng-xi/vite-plugin`](https://github.com/MengXi-Studio/vite-plugin) 的 `generateRouter` 插件，可从 `pages.json` 自动生成路由配置和类型声明：

```bash
pnpm add @meng-xi/vite-plugin -D
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { generateRouter } from '@meng-xi/vite-plugin'

export default defineConfig({
	plugins: [
		uni(),
		generateRouter({
			pagesJsonPath: 'src/pages.json',
			outputPath: 'src/router.config.ts',
			dts: true,
			metaMapping: {
				navigationBarTitleText: 'title',
				requireAuth: 'requireAuth'
			}
		})
	]
})
```

然后在 `main.ts` 中导入生成的路由配置：

```typescript
import { createRouter } from './uni_modules/mxuni-router/js_sdk/index.js'
import routes from './router.config'

const router = createRouter({ routes })
```

## API 概览

### 核心

| API                     | 说明                           |
| ----------------------- | ------------------------------ |
| `createRouter(options)` | 创建路由器实例                 |
| `useRouter()`           | 获取路由器实例（组合式 API）   |
| `useRoute()`            | 获取当前路由位置（组合式 API） |

### Router 实例方法

| 方法                          | 说明                   |
| ----------------------------- | ---------------------- |
| `router.push(location)`       | 导航到新页面           |
| `router.replace(location)`    | 替换当前页面           |
| `router.back(delta?)`         | 返回上一页或多级页面   |
| `router.beforeEach(guard)`    | 注册全局前置守卫       |
| `router.beforeResolve(guard)` | 注册全局解析守卫       |
| `router.afterEach(guard)`     | 注册全局后置钩子       |
| `router.onError(handler)`     | 注册错误处理回调       |
| `router.resolve(location)`    | 解析路由位置（不导航） |
| `router.getRoutes()`          | 获取所有路由配置       |
| `router.hasRoute(name)`       | 检查路由是否存在       |

### 错误码

| 错误码                  | 说明                               |
| ----------------------- | ---------------------------------- |
| `NAVIGATION_ABORTED`    | 导航被守卫中止                     |
| `NAVIGATION_CANCELLED`  | 导航被取消（守卫异常或重定向超限） |
| `NAVIGATION_DUPLICATED` | 重复导航到当前位置                 |
| `ROUTE_NOT_FOUND`       | 未找到匹配的路由                   |
| `NAVIGATION_API_ERROR`  | uni 导航 API 调用失败              |
| `SETUP_ERROR`           | 路由器初始化或使用方式错误         |

## TypeScript 类型提示

启用 `dts: true` 后，`generateRouter` 插件自动生成类型声明文件，为路由导航提供类型安全：

```typescript
// 路由名称自动补全
router.push({ name: 'pagesIndexIndex' }) // ✅ 自动补全
router.push({ name: 'invalidName' }) // ❌ 类型错误

// 路径自动补全
router.push({ path: '/pages/index/index' }) // ✅ 自动补全
router.push({ path: '/invalid/path' }) // ❌ 类型错误
```

## 与 pages.json 的关系

Uni Router **不替代** `pages.json`，而是与之配合使用：

| 职责       | pages.json        | Uni Router            |
| ---------- | ----------------- | --------------------- |
| 页面注册   | 必须声明          | 不负责                |
| 路由导航   | uni.navigateTo 等 | push / replace / back |
| 路由守卫   | 不支持            | beforeEach 等         |
| 路由元信息 | 不支持            | meta 字段             |
| 命名路由   | 不支持            | name 字段             |

## License

[MIT](LICENSE)
