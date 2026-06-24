# Installation

This chapter details the installation methods, environment requirements, and common issues for Uni Router.

## Prerequisites

### Required Environment

- **Node.js** >= 16
- **uni-app project** (must be based on Vue 3)
- **Package manager**: pnpm / npm / yarn

::: warning Vue 2 Not Supported
`@meng-xi/uni-router` is only compatible with Vue 3. Core functionality depends on Vue 3's Composition API (`inject` / `ref`), `app.provide`, `<script setup>` and other features, which cannot run in a Vue 2 environment.

If your project is Vue 2, please upgrade to Vue 3 first.
:::

### Supported Platforms

Uni Router supports all uni-app compilation targets:

| Platform | Support | Notes |
| --- | --- | --- |
| App (iOS/Android) | ✅ | Fully supported |
| H5 | ✅ | Fully supported |
| WeChat Mini Program | ✅ | Fully supported |
| Alipay Mini Program | ✅ | Fully supported |
| ByteDance Mini Program | ✅ | Fully supported |
| Baidu Mini Program | ✅ | Fully supported |
| QQ Mini Program | ✅ | Fully supported |
| Quick App | ⚠️ | Not fully tested |

## Installation Methods

### Method 1: npm install (recommended)

::: code-group

```bash [pnpm]
pnpm add @meng-xi/uni-router
```

```bash [npm]
npm install @meng-xi/uni-router
```

```bash [yarn]
yarn add @meng-xi/uni-router
```

:::

### Method 2: uni-app Plugin Market

Install with one click via the plugin market:

[Plugin Market](https://ext.dcloud.net.cn/plugin?id=28271)

::: tip Plugin Market Advantages
- One-click import to HBuilderX projects
- Automatic dependency handling
- Suitable for non-CLI created uni-app projects
:::

## Peer Dependencies

`@meng-xi/uni-router` declares `vue` as an optional peer dependency:

```json
{
  "peerDependencies": {
    "vue": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "vue": {
      "optional": true
    }
  }
}
```

### Projects with Vue 3 Already

No additional steps needed, just install directly.

### Projects Without Vue

If your project doesn't have Vue 3 installed yet, install it first:

```bash
pnpm add vue@^3.0.0
```

::: tip Why vue is an optional dependency
The core routing logic doesn't depend on the Vue runtime. Vue's `inject` feature is only needed when using the `useRouter()` / `useRoute()` composables. This design allows the core library to be used in non-Vue environments (like pure JavaScript projects).
:::

## TypeScript Support

`@meng-xi/uni-router` is written in TypeScript with built-in complete type definitions. No additional `@types` packages are needed.

### tsconfig Configuration

Ensure your `tsconfig.json` includes the following configuration:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@dcloudio/types"]
  }
}
```

### Install @dcloudio/types

`@dcloudio/types` provides type declarations for uni-app global APIs:

::: code-group

```bash [pnpm]
pnpm add -D @dcloudio/types
```

```bash [npm]
npm install -D @dcloudio/types
```

```bash [yarn]
yarn add -D @dcloudio/types
```

:::

## Verify Installation

### 1. Create Router Instance

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home' }
  ]
})

console.log(router.currentRoute.path) // Output: /
```

### 2. Check Type Hints

Type the following code in your editor, you should get type hints:

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: 'Home' } }
  ]
})

// Should have hints for push / replace / back methods
router.push({ name: 'home' })

// Should have hints for currentRoute property
console.log(router.currentRoute.meta.title)
```

### 3. Use in Components

```vue
<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

console.log(route.value.path)
</script>
```

## Common Installation Issues

### 1. Module Not Found

```
Cannot find module '@meng-xi/uni-router'
```

**Solutions**:

- Confirm the install command was executed
- Check if the package exists in `node_modules`
- Restart the TypeScript service (VS Code: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`)

### 2. Type Errors

```
Cannot find name 'uni'
```

**Solution**: Install `@dcloudio/types` and configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@dcloudio/types"]
  }
}
```

### 3. Vue Version Conflict

```
Vue packages version mismatch
```

**Solutions**:

- Confirm the project uses Vue 3
- Check the `vue` version in `package.json`
- Clean `node_modules` and reinstall:

```bash
rm -rf node_modules
pnpm install
```

### 4. HBuilderX Project Installation

For HBuilderX-created uni-app projects (non-CLI) installation methods:

1. Execute npm install command in the project root directory
2. Or import via the plugin market
3. Import via relative path or `@/` alias in code

### 5. Monorepo Installation

In a monorepo, it's recommended to install at the subproject level:

```bash
# Enter subproject
cd packages/my-app

# Install
pnpm add @meng-xi/uni-router
```

## Version Information

### Latest Version

Check [npm](https://www.npmjs.com/package/@meng-xi/uni-router) for the latest version.

### Versioning Strategy

Follows semantic versioning (SemVer):

- **Major version** (1.x.x → 2.0.0): Incompatible API changes
- **Minor version** (1.6.x → 1.7.0): Backward-compatible feature additions
- **Patch version** (1.7.0 → 1.7.1): Backward-compatible bug fixes

### Check Current Version

```bash
# Check installed version
pnpm list @meng-xi/uni-router

# Or in code
import { version } from '@meng-xi/uni-router'
console.log(version)
```

## Next Steps

- [Getting Started](./getting-started) — Start integrating from scratch
- [Route Configuration](./route-config) — Configure routes
- [Auto Generate Routes](./auto-generate) — Generate config from pages.json
