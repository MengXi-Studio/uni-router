# 介绍

::: warning Vue 3 Only
Uni Router 仅支持 uni-app 的 **Vue 3** 版本，不支持 Vue 2。这包括 Composition API（`useRouter` / `useRoute`）、`<script setup>` 组件语法以及 `app.provide` 等核心依赖。如果你的项目使用 Vue 2，请先迁移至 Vue 3。
:::

Uni Router 是一个专为 [uni-app](https://uniapp.dcloud.net.cn/) 设计的路由管理库，提供类似 [vue-router](https://router.vuejs.org/) 风格的 API 体验。

## 为什么需要它？

uni-app 原生使用 `uni.navigateTo`、`uni.redirectTo`、`uni.switchTab` 等 API 进行页面跳转，存在以下痛点：

- **缺乏路由守卫**：无法在导航前进行权限校验、登录检查等拦截操作
- **无路由元信息**：无法为路由附加 title、requireAuth 等自定义属性
- **API 碎片化**：需要手动判断使用 `navigateTo` 还是 `switchTab`，TabBar 页面切换逻辑分散
- **缺少组合式 API**：无法在 `<script setup>` 中方便地获取路由器实例和当前路由信息
- **错误处理不统一**：导航失败时缺乏结构化的错误信息和错误码

Uni Router 在 uni-app 原生路由 API 之上封装了一层，解决了上述问题，同时保持与 uni-app 静态页面模型（pages.json）的兼容。

## 核心特性

- 🧭 **路由导航** — `push()` / `replace()` / `back()`，自动识别 TabBar 页面
- 🛡️ **路由守卫** — `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- 📋 **路由元信息** — `title` / `isTab` / `requireAuth` 及自定义扩展字段
- 🌐 **多端兼容** — 基于 uni-app 原生 API，兼容所有 uni-app 目标平台
- 💪 **TypeScript** — 完整的类型定义和智能提示
- 🪝 **组合式 API** — `useRouter()` / `useRoute()`
- 🔄 **重定向支持** — 守卫中可重定向到其他路由，带深度限制防循环
- ⚡ **并发导航排队** — 自动排队处理并发导航请求

## 它不是什么

Uni Router **不是** vue-router 的完整移植。由于 uni-app 采用静态页面模型（pages.json 声明页面），以下 vue-router 特性**不被支持**：

- 动态路由注册（`router.addRoute()` / `router.removeRoute()`）
- 嵌套路由（嵌套的 `<router-view>`）
- 路由懒加载（uni-app 有自己的代码分割机制）
- History API 直接操作（`router.go()` / `router.forward()`）
- 命名视图

这些限制源于 uni-app 框架本身的设计，而非本库的不足。
