# Installation

## Prerequisites

- Node.js >= 16
- uni-app project (**must be based on Vue 3**, Vue 2 is not supported)
- pnpm / npm / yarn

::: warning Vue 2 Not Supported
`@meng-xi/uni-router` is only compatible with Vue 3. Core functionality depends on Vue 3 features such as Composition API (`inject` / `ref`), `app.provide`, and `<script setup>`, which cannot run in a Vue 2 environment.
:::

## Install Dependencies

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

## uni-app Plugin Market

If you are using a uni-app project, you can install it directly from the plugin market:

[Plugin Market](https://ext.dcloud.net.cn/plugin?id=28271)

## Peer Dependencies

`@meng-xi/uni-router` declares `vue` as an optional peer dependency. If your project already has Vue 3 installed, no additional steps are needed. If not, ensure Vue 3 is in your project:

```json
{
  "dependencies": {
    "vue": "^3.0.0"
  }
}
```

::: tip
`vue` is marked as optional because the core routing logic doesn't depend on the Vue runtime. You only need Vue's `inject` feature when using the `useRouter()` / `useRoute()` composables.
:::

## TypeScript Support

`@meng-xi/uni-router` is written in TypeScript with built-in type definitions. No additional `@types` packages are needed.

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@dcloudio/types"]
  }
}
```

::: info
`@dcloudio/types` provides type declarations for uni-app global APIs. Install it via `pnpm add -D @dcloudio/types` if not already present.
:::

## Verify Installation

Create a router instance and check if it works:

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home' }
  ]
})

console.log(router.currentRoute.path)
```

If the console outputs `/` (the initial route path), the installation is successful.
