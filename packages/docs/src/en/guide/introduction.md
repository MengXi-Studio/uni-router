# Introduction

::: warning Vue 3 Only
Uni Router only supports the **Vue 3** version of uni-app. Vue 2 is not supported. This includes core dependencies such as Composition API (`useRouter` / `useRoute`), `<script setup>` component syntax, and `app.provide`. If your project uses Vue 2, please migrate to Vue 3 first.
:::

Uni Router is a routing management library designed specifically for [uni-app](https://uniapp.dcloud.net.cn/), providing a [vue-router](https://router.vuejs.org/)-style API experience.

## Why Do You Need It?

uni-app natively uses `uni.navigateTo`, `uni.redirectTo`, `uni.switchTab` and other APIs for page navigation, which has the following pain points:

- **No route guards**: Cannot intercept navigation for permission checks, login verification, etc.
- **No route meta**: Cannot attach custom properties like title, requireAuth to routes
- **Fragmented API**: Need to manually choose between `navigateTo` and `switchTab`, TabBar page switching logic is scattered
- **No composables**: Cannot easily access router instance and current route info in `<script setup>`
- **Inconsistent error handling**: Lack of structured error information and error codes when navigation fails

Uni Router wraps a layer on top of uni-app's native routing APIs, solving the above problems while maintaining compatibility with uni-app's static page model (pages.json).

## Core Features

- 🧭 **Route Navigation** — `push()` / `replace()` / `relaunch()` / `back()`, automatically detect TabBar pages
- 🛡️ **Route Guards** — `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- 📦 **Params Passing** — `params` supports complex data (objects, arrays, etc.) without exposing in URL, with persistent storage support
- 🔢 **Query Enhancement** — `queryInt()` / `queryNumber()` / `queryBool()` convenience methods for auto-parsing query parameters
- 📋 **Route Meta** — `title` / `isTab` / `requireAuth` and custom extension fields
- 📡 **Page Communication** — `push()` supports `events` param and `eventChannel` return value for bidirectional page communication
- 🌐 **Multi-Platform** — Built on uni-app native APIs, compatible with all uni-app target platforms
- 💪 **TypeScript** — Complete type definitions and intellisense
- 🪝 **Composables** — `useRouter()` / `useRoute()`
- 🔄 **Redirect Support** — Guards can redirect to other routes with depth limit to prevent loops
- ⚡ **Concurrent Navigation Queue** — Automatically queue concurrent navigation requests

## What It Is Not

Uni Router is **not** a complete port of vue-router. Due to uni-app's static page model (pages.json declares pages), the following vue-router features are **not supported**:

- Dynamic route registration (`router.addRoute()` / `router.removeRoute()`)
- Nested routes (nested `<router-view>`)
- Route lazy loading (uni-app has its own code splitting mechanism)
- Direct History API manipulation (`router.go()` / `router.forward()`)
- Named views

These limitations stem from the uni-app framework's design, not from this library's shortcomings.
