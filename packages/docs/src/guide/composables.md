# 组合式 API

Uni Router 提供两个组合式函数，用于在 Vue 3 的 `<script setup>` 中访问路由器实例和当前路由信息。

## useRouter()

获取当前路由器实例。必须在 Vue 组件的 `setup()` 函数中调用，且需先通过 `app.use(router)` 安装路由器。

```ts
import { useRouter } from '@meng-xi/uni-router'

const router = useRouter()

await router.push({ name: 'about' })
await router.back()
```

### 错误情况

| 场景            | 错误码        | 说明                         |
| --------------- | ------------- | ---------------------------- |
| 在 setup 外调用 | `SETUP_ERROR` | `inject` 只能在 setup 中使用 |
| 未安装路由器    | `SETUP_ERROR` | 需先调用 `app.use(router)`   |

## useRoute()

获取当前路由位置的响应式引用。必须在 Vue 组件的 `setup()` 函数中调用。

```ts
import { useRoute } from '@meng-xi/uni-router'

const route = useRoute()

// 在 <script setup> 中通过 .value 访问
console.log(route.value.path)
console.log(route.value.query)
console.log(route.value.meta)
```

```vue
<template>
	<!-- 模板中自动解包，无需 .value -->
	<text>当前路径：{{ route.path }}</text>
	<text>查询参数：{{ route.query.id }}</text>
</template>
```

::: tip
`useRoute()` 返回 `Ref<RouteLocation>`，当路由发生变化时会自动更新，组件会重新渲染。
同一路由器实例共享同一个响应式 ref，确保所有组件获取一致的路由状态。
:::

## 在选项式 API 中使用

如果使用选项式 API，可通过 `this.$router` 和 `this.$route` 访问：

```vue
<script>
export default {
	computed: {
		currentPath() {
			return this.$route.path
		}
	},
	methods: {
		navigate() {
			this.$router.push({ name: 'about' })
		}
	}
}
</script>
```

## 完整示例

```vue
<template>
	<view class="container">
		<text>当前路径：{{ route.path }}</text>
		<text>页面标题：{{ route.meta.title }}</text>
		<text>查询参数：{{ JSON.stringify(route.query) }}</text>

		<button @click="goAbout">前往关于页</button>
		<button @click="goBack">返回</button>
	</view>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

async function goAbout() {
	try {
		await router.push({ name: 'about', query: { from: 'home' } })
	} catch (error) {
		console.error('导航失败', error)
	}
}

async function goBack() {
	try {
		await router.back()
	} catch (error) {
		console.error('返回失败', error)
	}
}
</script>
```
