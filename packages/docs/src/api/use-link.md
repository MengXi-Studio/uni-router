# useLink()

暴露 [RouterLink](../component/router-link) 内部行为为组合式 API，用于构建自定义导航组件。

## 类型

```ts
function useLink(options: UseLinkOptions): UseLinkReturn
```

## 参数

### options

| 属性 | 类型 | 说明 |
|------|------|------|
| `to` | `RouteLocationRaw` | 目标路由位置，支持路径字符串、路径对象或命名路由对象 |
| `replace?` | `boolean` | 是否使用 `replace` 模式导航 |
| `relaunch?` | `boolean` | 是否使用 `relaunch` 模式导航（关闭所有页面并打开目标页面） |

## 返回值

返回 `UseLinkReturn` 对象，包含以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `route` | `ComputedRef<RouteLocation>` | 解析后的路由对象 |
| `href` | `ComputedRef<string>` | 目标路径字符串（fullPath，含 query） |
| `isActive` | `ComputedRef<boolean>` | 当前路由是否匹配此链接（比较 `path`） |
| `isExactActive` | `ComputedRef<boolean>` | 当前路由是否完全匹配此链接（比较 `fullPath`） |
| `navigate` | `() => Promise<NavigationResult>` | 执行导航到目标页面 |

## 调用约束

::: warning 必须在 setup 中调用
`useLink()` 内部依赖 `useRouter()` 和 `useRoute()`，只能在组件的 `setup()` 函数（或 `<script setup>`）中调用。
:::

## 示例

### 基本用法

```vue
<script setup lang="ts">
import { useLink } from '@meng-xi/uni-router'

const { href, isActive, isExactActive, navigate } = useLink({
  to: { name: 'pagesDetailDetail', query: { id: '1' } }
})
</script>

<template>
  <view :class="{ active: isActive }" @click="navigate">
    <text>详情页 ({{ href }})</text>
  </view>
</template>
```

### 自定义导航组件

```vue
<script setup lang="ts">
import { useLink } from '@meng-xi/uni-router'
import { computed } from 'vue'

const props = defineProps<{
  to: RouteLocationRaw
  replace?: boolean
  activeClass?: string
}>()

const { href, isActive, navigate } = useLink(props)
const classes = computed(() => ({
  'nav-link': true,
  [props.activeClass || 'active']: isActive.value
}))
</script>

<template>
  <view :class="classes" @click="navigate">
    <slot />
  </view>
</template>
```

### 响应式匹配

```vue
<script setup lang="ts">
import { useLink } from '@meng-xi/uni-router'
import { computed } from 'vue'

const homeLink = useLink({ to: { name: 'pagesIndexIndex' } })
const aboutLink = useLink({ to: { name: 'pagesAboutAbout' } })
const navLink = useLink({ to: { name: 'pagesNavigationNavigation' } })

const currentTab = computed(() => {
  if (homeLink.isActive.value) return 'home'
  if (aboutLink.isActive.value) return 'about'
  if (navLink.isActive.value) return 'nav'
  return null
})
</script>
```

## 与 RouterLink 的关系

`useLink()` 是 [RouterLink 组件](../component/router-link) 的内部实现，组件内部使用 `useLink()` 获取导航状态。通过 `useLink()`，你可以在不依赖 `RouterLink` 组件的情况下构建自定义导航逻辑。

## 下一步

- [RouterLink 组件](../component/router-link) — 声明式导航组件
- [useRouter](./use-router) — 路由器实例
- [组合式 API 指南](../guide/composables) — 组合式 API 详解