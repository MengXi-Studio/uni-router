# 安装

## 前置条件

- Node.js >= 16
- uni-app 项目（**必须基于 Vue 3**，不支持 Vue 2）
- pnpm / npm / yarn

::: warning Vue 2 不支持
`@meng-xi/uni-router` 仅兼容 Vue 3。核心功能依赖 Vue 3 的 Composition API（`inject` / `ref`）、`app.provide`、`<script setup>` 等特性，无法在 Vue 2 环境下运行。
:::

## 安装依赖

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

也可以通过 [uni-app 插件市场](https://ext.dcloud.net.cn/plugin?id=28271) 安装。

## 对等依赖

`@meng-xi/uni-router` 将 `vue` 声明为可选的对等依赖。如果你的项目已经安装了 Vue 3，则无需额外操作。如果未安装，需要确保项目中有 Vue 3：

```json
{
  "dependencies": {
    "vue": "^3.0.0"
  }
}
```

::: tip
`vue` 被标记为可选依赖，因为路由核心逻辑不依赖 Vue 运行时。仅在需要使用 `useRouter()` / `useRoute()` 组合式 API 时才需要 Vue 的 `inject` 功能。
:::

## TypeScript 支持

`@meng-xi/uni-router` 使用 TypeScript 编写，内置完整的类型定义，无需额外安装 `@types` 包。

确保你的 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@dcloudio/types"]
  }
}
```

::: info
`@dcloudio/types` 提供了 uni-app 全局 API 的类型声明。如果你的项目尚未安装，可通过 `pnpm add -D @dcloudio/types` 安装。
:::

## 验证安装

创建路由器实例并检查是否正常工作：

```ts
import { createRouter } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home' }
  ]
})

console.log(router.currentRoute.path)
```

如果控制台输出 `/`（初始路由路径），则说明安装成功。
