# 入门

Uni Router 基于 Uni-App 的路由 API 进行封装。它为 Uni-App 应用程序提供了一个简单易用的路由系统。

采用类似 [`vue-router`](https://router.vuejs.org/) 的设计风格，并提供丰富的工具函数，帮助开发者轻松实现跨平台路由管理。

::: tip 学习基础

这份指南假设你已经对 Uni-App 有了一定的了解。你不必是 Uni-App 的专家，但你也许偶尔需要查看 [Uni-App 的文档](https://uniapp.dcloud.net.cn/) 来了解某些特性。

:::

## 示例

为了引入一些核心概念，我们将使用如下的示例：

- [Uni Router 的示例](https://github.com/MengXi-Studio/Uni Router/tree/master/packages/playground)

让我们首先来看目录 `src/pages/index` 下的组件, `index.vue`。

### App.vue

```vue
<template>
	<h1>Hello App!</h1>
	<mx-router to="/pages/test/index">
		<text>MX组件测试</text>
	</mx-router>
</template>
```

在这个 `template` 中使用了一个由 Uni Router 提供的组件: `Router`。

不同于 Uni-App 的 [`<navigator>`](https://uniapp.dcloud.net.cn/component/navigator.html) 标签，我们使用组件 `Router` 来创建链接。使用 `Router` 组件的属性 `to` 可以传递路由地址或者路由对象，而不是局限于只能使用路由地址。
我们将会在之后的部分深入了解 `Router` 组件。

### 创建路由器实例

路由器实例是通过 `Router` 类创建的:

```ts
import { Router } from '@meng-xi/Uni Router'

const router = new Router({
	routes: [
		{ path: '/pages/index/index', meta: { title: '首页' } },
		{ path: '/pages/test/index', meta: { requiresAuth: true } }
	]
})
```

或者使用单例模式创建:

```ts
import { Router } from '@meng-xi/Uni Router'

Router.getInstance({
	routes: [
		{ path: '/pages/index/index', meta: { title: '首页' } },
		{ path: '/pages/test/index', meta: { requiresAuth: true } }
	]
})
```

这里的 `routes` 是一个可选参数，目前的版本暂时没有作用。后续的版本中，此参数会用于生成 [`pages.json`](https://uniapp.dcloud.net.cn/collocation/pages.html) 文件。

其他可以设置的路由选项我们会在之后的版本中逐渐添加以及介绍，目前我们只需要了解 `路由器实例`。

### 访问路由器和当前路由

你很可能想要在应用的其他地方访问路由器。

你可以将路由器实例直接导入到你需要它的地方。或者通过配置挂载到 Vue 实例上，通过 `$router` 直接访问。

```ts
// uni-app的vue3版本
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
	const app = createSSRApp(App)

	app.config.globalProperties.$router = router

	return {
		app
	}
}
```

如果我们使用选项式 API，我们可以在 JavaScript 中如下访问这个属性：`this.$router`。

```js
export default {
	methods: {
		goToAbout() {
			this.$router.push('/pages/test/index')
		}
	}
}
```

这里调用了 `push()`，这是用于[编程式导航]()的方法。我们会在后面详细了解。

对于组合式 API，我们不能通过 `this` 访问组件实例，所以我们直接使用上述创建的路由实例：

```vue
<script setup>
import router from '@/router'

function toTest() {
	router.push({
		path: '/pages/test/index',
		query: {
			name: 'Test User',
			age: 25
		}
	})
}
</script>
```

## 本教程的约定

### 单文件组件

Uni Router 只适用于 Uni-App 项目中的打包工具 (如 Vite/Webpack) 和[Uni-App 组件](https://uniapp.dcloud.net.cn/tutorial/vue3-components.html) (即 `.vue` 文件) 的应用中使用。

::: danger 注意

`Uni Router` 不支持除 `Uni-App` 外的项目中使用。

:::

### 组件 API 风格

Uni Router 可以使用组合式 API 或选项式 API 。在必要时，示例将会同时使用两种风格，组合式 API 示例通常会使用 `<script setup>`，而不是显式的 `setup` 函数。

如果你对于这两种风格不熟悉，可以参考 [Vue - API 风格](https://cn.vuejs.org/guide/introduction.html#api-styles)。

所以，此库支持 `Uni-App` 的 `Vue2` 和 `Vue3` 版本。但是有部分函数可能只支持 `Vue3` 。

### `router`

在本教程中，我们常常以 `router` 作为路由器实例提及。即由 `new Router()` 创建的对象。在应用中，访问该对象的方式取决于上下文。例如，在组合式 API 中，它可以通过导入创建的对象来访问。在选项式 API 中，它可以通过配置到 `Vue`
实例的 `$router` 属性来访问。

### `Router`

组件 `Router` 不会自动注册为全局组件，但是可以通过 `Uni-App` 的 `easycom` 来简化组件的引入和注册。但你也可以通过局部导入它们，例如 `import RouterLink from '@meng-xi/Uni Router/components/router/router.vue'`。

在模板中，组件的名字可以是 PascalCase 风格或 kebab-case 风格的。Uni-App 支持两种格式，因此 `<RouterLink>` 和 `<router-link>` 通常是等效的。此时应该遵循你自己项目中使用的约定。
