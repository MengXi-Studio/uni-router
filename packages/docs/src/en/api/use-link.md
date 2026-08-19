# useLink()

Exposes the internal behavior of [RouterLink](../../component/router-link) as a composable, for building custom navigation components.

## Type

```ts
function useLink(options: UseLinkOptions): UseLinkReturn
```

## Parameters

### options

| Property | Type | Description |
|----------|------|-------------|
| `to` | `RouteLocationRaw` | Target route location |
| `replace?` | `boolean` | Whether to use `replace` mode |
| `relaunch?` | `boolean` | Whether to use `relaunch` mode |

## Return Value

Returns a `UseLinkReturn` object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `route` | `ComputedRef<RouteLocation>` | Resolved route object |
| `href` | `ComputedRef<string>` | Target path string (fullPath with query) |
| `isActive` | `ComputedRef<boolean>` | Whether current route matches (by `path`) |
| `isExactActive` | `ComputedRef<boolean>` | Whether current route exactly matches (by `fullPath`) |
| `navigate` | `() => Promise<NavigationResult>` | Navigate to the target page |

## Call Constraints

::: warning Must be called inside setup
`useLink()` internally depends on `useRouter()` and `useRoute()`, so it can only be called inside a component's `setup()` function (or `<script setup>`).
:::

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import { useLink } from '@meng-xi/uni-router'

const { href, isActive, isExactActive, navigate } = useLink({
  to: { name: 'pagesDetailDetail', query: { id: '1' } }
})
</script>

<template>
  <view :class="{ active: isActive }" @click="navigate">
    <text>Detail ({{ href }})</text>
  </view>
</template>
```

### Custom Navigation Component

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

### Reactive Matching

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

## Relationship with RouterLink

`useLink()` is the internal implementation of the [RouterLink component](../../component/router-link). The component uses `useLink()` internally to obtain navigation state. With `useLink()`, you can build custom navigation logic without relying on the `RouterLink` component.

## Next Steps

- [RouterLink Component](../../component/router-link) — Declarative navigation component
- [useRouter](./use-router) — Router instance
- [Composables Guide](../../guide/composables) — Detailed composables guide