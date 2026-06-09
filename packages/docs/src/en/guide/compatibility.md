# Platform Compatibility

Uni Router is built on uni-app's native navigation APIs and is compatible with all platforms supported by uni-app.

## Vue Version Requirements

::: warning Vue 3 Only
Uni Router **only supports uni-app Vue 3**. Vue 2 is not supported. Reasons include:

- Uses Vue 3 Composition API such as `inject` / `ref`
- Uses Vue 3 app instance APIs like `app.provide()` and `app.onUnmount()`
- `RouterLink` component uses `<script setup>` and `defineProps` / `defineEmits` compiler macros
- `peerDependencies` declares `vue >= 3.0.0`

If your project still uses Vue 2, please refer to the [uni-app Vue 3 Migration Guide](https://uniapp.dcloud.net.cn/tutorial/vue3-api.html) to upgrade first.
:::

## Supported Platforms

| Platform               | push | replace | back | Guards | Meta |
| ---------------------- | ---- | ------- | ---- | ------ | ---- |
| H5                     | ✅   | ✅      | ✅   | ✅     | ✅   |
| iOS                    | ✅   | ✅      | ✅   | ✅     | ✅   |
| Android                | ✅   | ✅      | ✅   | ✅     | ✅   |
| WeChat Mini Program    | ✅   | ✅      | ✅   | ✅     | ✅   |
| Alipay Mini Program    | ✅   | ✅      | ✅   | ✅     | ✅   |
| Baidu Mini Program     | ✅   | ✅      | ✅   | ✅     | ✅   |
| ByteDance Mini Program | ✅   | ✅      | ✅   | ✅     | ✅   |
| QQ Mini Program        | ✅   | ✅      | ✅   | ✅     | ✅   |

## Platform Differences

### switchTab Does Not Support Query Parameters

`uni.switchTab` on all platforms does not support passing query parameters. When navigating to a TabBar page with query, Uni Router outputs a warning and ignores the parameters:

```ts
router.push({ name: 'user', query: { tab: 'settings' } })
// ⚠️ uni.switchTab does not support query parameters. They will be ignored.
```

### replace to TabBar Page

`uni.switchTab` on all platforms closes all non-tab pages instead of just replacing the current page:

```ts
router.replace({ name: 'user' })
// ⚠️ router.replace() to a tab page will close all non-tab pages instead of replacing the current page only
```

### getCurrentPages() Differences

- **H5**: Page stack starts from the home page
- **Mini Programs**: Page stack starts from the current mini program launch page
- **App**: Page stack starts from the app launch page

Uni Router gets current page information through `getCurrentPages()` during initialization, with consistent behavior across platforms.

## Unsupported vue-router Features

The following vue-router features are not supported on all platforms due to uni-app framework limitations:

| Feature                    | Reason                                         |
| -------------------------- | ---------------------------------------------- |
| `router.go(n)`             | Mini programs don't support forward navigation |
| `router.forward()`         | Mini programs don't support forward navigation |
| Dynamic route registration | uni-app uses static pages.json                 |
| Nested routes              | uni-app has no nested view component           |
| Route lazy loading         | uni-app has its own code splitting mechanism   |

## Best Practices

1. **TabBar pages must set `isTab: true`**: Ensure the router uses the correct navigation API
2. **Avoid passing query when navigating to TabBar pages**: `switchTab` doesn't support query parameters
3. **Use named routes**: Safer than path strings, only need to modify route config when refactoring
4. **Handle permissions in guards**: Centralize permission checks in `beforeEach`
