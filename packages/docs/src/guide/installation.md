# 安装

本章详细讲解 Uni Router 的安装方式、环境要求和常见问题。

## 前置条件

### 必需环境

- **Node.js** >= 16
- **uni-app 项目**（必须基于 Vue 3）
- **包管理器**：pnpm / npm / yarn

::: warning Vue 2 不支持
`@meng-xi/uni-router` 仅兼容 Vue 3。核心功能依赖 Vue 3 的 Composition API（`inject` / `ref`）、`app.provide`、`<script setup>` 等特性，无法在 Vue 2 环境下运行。

如果你的项目是 Vue 2，请先升级到 Vue 3。
:::

### 支持的平台

Uni Router 支持所有 uni-app 编译目标：

| 平台 | 支持 | 说明 |
| --- | --- | --- |
| App (iOS/Android) | ✅ | 完整支持 |
| H5 | ✅ | 完整支持 |
| 微信小程序 | ✅ | 完整支持 |
| 支付宝小程序 | ✅ | 完整支持 |
| 字节小程序 | ✅ | 完整支持 |
| 百度小程序 | ✅ | 完整支持 |
| QQ 小程序 | ✅ | 完整支持 |
| 快应用 | ⚠️ | 未充分测试 |

## 安装方式

### 方式一：npm 安装（推荐）

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

### 方式二：uni-app 插件市场

通过插件市场一键安装：

[插件市场地址](https://ext.dcloud.net.cn/plugin?id=28271)

::: tip 插件市场优势
- 一键导入到 HBuilderX 项目
- 自动处理依赖关系
- 适合非 CLI 创建的 uni-app 项目
:::

## 对等依赖

`@meng-xi/uni-router` 将 `vue` 声明为可选的对等依赖：

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

### 已有 Vue 3 的项目

无需额外操作，直接安装即可。

### 未安装 Vue 的项目

如果你的项目尚未安装 Vue 3，需先安装：

```bash
pnpm add vue@^3.0.0
```

::: tip 为何 vue 是可选依赖
路由核心逻辑不依赖 Vue 运行时。仅在需要使用 `useRouter()` / `useRoute()` / `usePageChannel()` 组合式 API 时才需要 Vue 的 `inject` 功能。这样设计使得核心库可以在非 Vue 环境中使用（如纯 JavaScript 项目）。
:::

## TypeScript 支持

`@meng-xi/uni-router` 使用 TypeScript 编写，内置完整的类型定义，无需额外安装 `@types` 包。

### tsconfig 配置

确保 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@dcloudio/types"]
  }
}
```

### 安装 @dcloudio/types

`@dcloudio/types` 提供 uni-app 全局 API 的类型声明：

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

## 验证安装

### 1. 创建路由器实例

```ts
import { createRouter, ParamsPlugin, ChannelPlugin, InterceptorPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { isTab: true } }
  ],
  plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin],
  interceptUniApi: true // 需要 InterceptorPlugin
})

console.log(router.currentRoute.path) // 输出: /
```

::: tip 插件按需引入
扩展功能（params、animation、channel、interceptor）通过 `plugins` 按需注册，未注册的插件功能不可用（使用时抛出 `PLUGIN_REQUIRED` 错误）。详见[插件系统](./plugins)。
:::

### 2. 检查类型提示

在编辑器中输入以下代码，应有类型提示：

```ts
import { createRouter, AnimationPlugin } from '@meng-xi/uni-router'

const router = createRouter({
  routes: [
    { path: 'pages/index/index', name: 'home', meta: { title: '首页' } }
  ],
  plugins: [AnimationPlugin]
})

// 应有 push / replace / back 等方法的提示
router.push({ name: 'home' })

// 应有 currentRoute 属性的提示
console.log(router.currentRoute.meta.title)
```

### 3. 在组件中使用

```vue
<script setup lang="ts">
import { useRouter, useRoute } from '@meng-xi/uni-router'

const router = useRouter()
const route = useRoute()

console.log(route.value.path)
</script>
```

## 常见安装问题

### 1. 找不到模块

```
Cannot find module '@meng-xi/uni-router'
```

**解决方案**：

- 确认已执行安装命令
- 检查 `node_modules` 是否存在该包
- 重启 TypeScript 服务（VS Code: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`）

### 2. 类型错误

```
Cannot find name 'uni'
```

**解决方案**：安装 `@dcloudio/types` 并配置 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "types": ["@dcloudio/types"]
  }
}
```

### 3. Vue 版本冲突

```
Vue packages version mismatch
```

**解决方案**：

- 确认项目使用 Vue 3
- 检查 `package.json` 中的 `vue` 版本
- 清理 `node_modules` 并重新安装：

```bash
rm -rf node_modules
pnpm install
```

### 4. HBuilderX 项目安装

HBuilderX 创建的 uni-app 项目（非 CLI）安装方式：

1. 在项目根目录执行 npm 安装命令
2. 或通过插件市场导入
3. 在代码中通过相对路径或 `@/` 别名引入

### 5. monorepo 安装

在 monorepo 中，建议在子项目级别安装：

```bash
# 进入子项目
cd packages/my-app

# 安装
pnpm add @meng-xi/uni-router
```

## 版本说明

### 最新版本

查看 [npm](https://www.npmjs.com/package/@meng-xi/uni-router) 获取最新版本。

### 版本策略

遵循语义化版本（SemVer）：

- **主版本号**（1.x.x → 2.0.0）：不兼容的 API 修改
- **次版本号**（1.6.x → 1.7.0）：向下兼容的功能新增
- **修订号**（1.7.0 → 1.7.1）：向下兼容的问题修复

### 查看当前版本

```bash
# 查看已安装版本
pnpm list @meng-xi/uni-router

# 或在代码中
import { version } from '@meng-xi/uni-router'
console.log(version)
```

## 下一步

- [快速开始](./getting-started) — 从零开始集成
- [路由配置](./route-config) — 配置路由
- [自动生成路由配置](./auto-generate) — 从 pages.json 生成配置
