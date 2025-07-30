# Getting Started

Uni Router is encapsulated based on the routing API of Uni-App. It provides a simple and easy-to-use routing system for Uni-App applications.

Adopt a design style similar to [`vue-router`](https://router.vuejs.org/) and provide a rich set of utility functions to help developers easily implement cross-platform routing management.

::: tip Learn the basics

This guide assumes that you have some basic knowledge of Uni-App. You don't need to be an expert in Uni-App, but you might sometimes need to refer to the [Uni-App documentation](https://uniapp.dcloud.net.cn/) to
understand certain features.

:::

## An example

To introduce some core concepts, we will use the following example:

- [Examples of Uni Router](https://github.com/MengXi-Studio/Uni Router/tree/master/packages/playground)

Let's first look at the component `index.vue` in the directory `src/pages/index`.

### App.vue

```vue
<template>
	<h1>Hello App!</h1>
	<mx-router to="/pages/test/index">
		<text>MX Component Test</text>
	</mx-router>
</template>
```

In this `template`, we use a component provided by Uni Router: `Router`.

Unlike the [`<navigator>`](https://uniapp.dcloud.net.cn/component/navigator.html) tag in Uni-App, we use the `Router` component to create links. The `to` attribute of the `Router` component can pass a route address or a
route object, instead of being limited to only using route addresses. We will learn more about the `Router` component in the following sections.

### Create a router instance

A router instance is created by the `Router` class:

```ts
import { Router } from '@meng-xi/Uni Router'

const router = new Router({
	routes: [
		{ path: '/pages/index/index', meta: { title: 'Home' } },
		{ path: '/pages/test/index', meta: { requiresAuth: true } }
	]
})
```

Or create a router instance using the singleton pattern:

```ts
import { Router } from '@meng-xi/Uni Router'

Router.getInstance({
	routes: [
		{ path: '/pages/index/index', meta: { title: 'Home' } },
		{ path: '/pages/test/index', meta: { requiresAuth: true } }
	]
})
```

The `routes` parameter is optional and currently has no effect. In future versions, this parameter will be used to generate the [`pages.json`](https://uniapp.dcloud.net.cn/collocation/pages.html) file.

Other route options we will gradually add and introduce in future versions, currently we only need to understand the `router instance`.

### Access the router and current route

You are likely to want to access the router in other parts of your application.

You can import the router instance directly where you need it. Or configure it to be mounted on the Vue instance, and access it directly through `$router`.

```ts
// uni-app's vue3 version
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

If we use the Options API, we can access this property as follows in JavaScript: `this.$router`.

```js
export default {
	methods: {
		goToAbout() {
			this.$router.push('/pages/test/index')
		}
	}
}
```

Here we call `push()`, which is a method used for [programmatic navigation](). We will learn more about it in detail later.

For the Composition API, we cannot access the component instance through `this`, so we directly use the created router instance:

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

## Conventions used in this tutorial

### Single File Components

Uni Router is only applicable in Uni-App projects using the bundler (such as Vite/Webpack) and [Uni-App components](https://uniapp.dcloud.net.cn/tutorial/vue3-components.html) (i.e. `.vue` files).

::: danger Note

`Uni Router` is not supported in projects other than `Uni-App`.

:::

### Component API Styles

Uni Router can use the Composition API or the Options API. In cases where necessary, the example will use both styles simultaneously, with the Composition API example typically using `<script setup>` and not an explicit
`setup` function.

If you are not familiar with these two styles, you can refer to [Vue - API Styles](https://cn.vuejs.org/guide/introduction.html#api-styles).

So, this library supports the `Vue2` and `Vue3` versions of `Uni-App`. However, some functions may only support `Vue3`.

### `router`

In this tutorial, we often mention the `router` as the router instance. That is the object created by `new Router()`. In the application, the way to access this object depends on the context. For example, in the
Composition API, it can be accessed by importing the created object. In the Options API, it can be accessed through the `$router` property of the `Vue` instance.

### `Router`

Component `Router` will not be automatically registered as a global component. However, you can simplify the introduction and registration of components by using `Uni-App`'s `easycom`. But you can also import them
locally, for example `import RouterLink from '@meng-xi/Uni Router/components/router/router.vue'`.

In the template, the name of the component can be in PascalCase style or kebab-case style. Uni-App supports both formats, so `<RouterLink>` and `<router-link>` are typically equivalent. At this point, you should follow
the conventions used in your own project.
