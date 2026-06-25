# Introduction

::: warning Vue 3 Only
Uni Router only supports the **Vue 3** version of uni-app, not Vue 2. Core functionality depends on Composition API (`inject` / `ref`), `app.provide`, `<script setup>` and other features.
:::

## What It Is

Uni Router is a routing management library designed for [uni-app](https://uniapp.dcloud.net.cn/), wrapping a layer on top of uni-app's native navigation APIs to provide a [vue-router](https://router.vuejs.org/)-style API experience.

## Why You Need It

uni-app natively uses `uni.navigateTo`, `uni.redirectTo`, `uni.switchTab` and other APIs for page navigation, which has the following pain points:

| Pain Point | Native Solution | Uni Router Solution |
| --- | --- | --- |
| No route guards | Cannot intercept before navigation | `beforeEach` / `beforeResolve` / `afterEach` |
| No route meta | Cannot attach properties to routes | `meta` field, supports custom extension |
| Fragmented API | Manually choose navigateTo / switchTab | Auto-select based on `meta.isTab` |
| No composables | Cannot access router in setup | `useRouter()` / `useRoute()` |
| Inconsistent error handling | Callback-style, no structured error codes | `NavigationFailure` + error codes |
| Limited param passing | Only URL query supported | `params` supports complex data + persistence |

## Architecture Overview

Understanding Uni Router's architecture helps you master all its features.

```
┌─────────────────────────────────────────────────────┐
│                   Your Application Code              │
│         router.push() / useRouter() / ...            │
├─────────────────────────────────────────────────────┤
│                   Uni Router                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Navigation │  │  Guards   │  │ Composables/Plugin│  │
│  │ push etc  │→│ beforeEach│  │  useRouter etc    │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │             │                                │
│  ┌────▼─────────────▼────┐  ┌───────────────────┐   │
│  │  Navigation Engine     │  │  Route Matcher    │   │
│  │ Guards→API→State       │  │  path/name match  │   │
│  └────────┬──────────────┘  └───────────────────┘   │
│           │                                          │
│  ┌────────▼──────┐  ┌────────────┐  ┌────────────┐  │
│  │ Interceptor   │  │ Params Mgr │  │ State Sync │  │
│  │ interceptUniApi│  │ params Map │  │ syncRoute  │  │
│  └───────────────┘  └────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────┤
│              uni-app Native Navigation API           │
│     uni.navigateTo / redirectTo / switchTab / ...    │
├─────────────────────────────────────────────────────┤
│              uni-app Page Stack (pages.json)         │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Application Layer**: Your code calls `router.push()` and other APIs
2. **Uni Router Layer**: Guard chain scheduling, route matching, state management, param passing
3. **uni-app Layer**: Native APIs that actually execute page navigation
4. **Page Stack**: Page stack managed by uni-app framework, statically declared by `pages.json`

::: tip Key Insight
Uni Router **does not replace** uni-app's navigation mechanism; it adds a "scheduling layer" on top. All navigation ultimately executes through `uni.navigateTo` and other APIs, so all uni-app limitations (like `switchTab` not supporting query) still exist. Uni Router just provides elegant wrappers and hints on top of these limitations.
:::

## Core Concepts

### Page Stack

uni-app maintains a page stack with a maximum depth of 10 (mini-program limit). Understanding the page stack is fundamental to mastering Uni Router:

| Operation | Stack Change | uni API |
| --- | --- | --- |
| `push()` | Push (+1) | `uni.navigateTo` |
| `replace()` | Replace top | `uni.redirectTo` |
| `relaunch()` | Clear then push | `uni.reLaunch` |
| `back()` | Pop (-n) | `uni.navigateBack` |
| TabBar switch | Close non-tab pages | `uni.switchTab` |

::: warning Page Stack Depth Limit
Mini-program platforms have a maximum page stack depth of **10**. `navigateTo` fails when exceeded. Uni Router cannot break this limit; recommend using `relaunch()` to reset the stack, or `back()` then `push()`.
:::

### Route Matching

Uni Router supports two matching methods:

- **Path matching**: `router.push({ path: 'pages/about/about' })`
- **Name matching**: `router.push({ name: 'about' })`

Paths are auto-normalized (leading `/` added). Name matching is safer for refactoring—just modify the route config.

::: info Difference from vue-router
uni-app's page paths are determined at compile time by `pages.json` and **do not support dynamic routing** (like `/user/:id`). Use `query` or `params` to pass parameters.
:::

### Route Guards

Guards are Uni Router's core capability, allowing you to insert logic before/after navigation:

```
Navigation triggered
  → beforeEach (global pre)
  → beforeEnter (route-specific)
  → beforeResolve (global resolve)
  → uni API call
  → afterEach (global post)
```

Guards can pass via `next()`, abort via `next(false)`, or redirect via `next(location)`. See [Route Guards](./guards).

### State Synchronization

Since physical back buttons and browser back **don't go through the router**, the router's `currentRoute` may be out of sync with the actual page. Uni Router provides `syncRoute()` to read the real state from the page stack and update.

```
User presses physical back
  → uni-app native navigateBack (bypasses router)
  → router currentRoute is still old value
  → Call syncRoute() in page onShow
  → currentRoute updates to real page
```

::: warning This is an inherent uni-app limitation
The router cannot intercept physical back buttons and browser back. You must call `syncRoute()` in the page's `onShow` lifecycle to maintain state consistency. See [Platform Compatibility](./compatibility).
:::

## Design Philosophy

1. **Enhance, not replace**: Uni Router doesn't bypass uni-app's navigation mechanism; all navigation goes through native APIs. This ensures cross-platform compatibility and means uni-app's limitations still apply.

2. **Static page model**: uni-app uses `pages.json` to statically declare pages. Uni Router respects this model and doesn't provide dynamic route registration (`addRoute` / `removeRoute`).

3. **Progressive adoption**: You can use just `push` / `replace` basic navigation, or enable guards, interceptors, param passing and other advanced features. `interceptUniApi` is disabled by default and doesn't affect existing code.

4. **Type safety**: Through `@meng-xi/vite-plugin`'s `dts` feature, route names and paths get autocompletion and type checking.

## Core Features Overview

- 🧭 **Four navigation types** — `push` / `replace` / `relaunch` / `back`, auto-detect TabBar pages
- 🛡️ **Complete guard chain** — `beforeEach` / `beforeResolve` / `afterEach` / `beforeEnter`
- 🔄 **Controllable redirect** — `next(location, { mode })` in guards to specify redirect method
- 📦 **Page params** — `params` passes complex data, not exposed in URL, supports persistence
- 🔢 **Query enhancement** — `queryInt()` / `queryNumber()` / `queryBool()` type parsing
- 📡 **Page communication** — `events` + `eventChannel` bidirectional communication
- 🎬 **Navigation animation** — App custom animation, route-level defaults
- 🪝 **Composables** — `useRouter()` / `useRoute()` reactive access
- ⚡ **API interception** — Optional interception of native navigation APIs, unified guard flow
- 🛡️ **Timeout protection** — `guardTimeout` / `readyTimeout` prevent hanging
- 💪 **TypeScript** — Complete type definitions + intellisense

## What It Is Not

Due to uni-app framework limitations, the following vue-router features are **not supported**:

| Feature | Reason |
| --- | --- |
| Dynamic route registration (`addRoute` / `removeRoute`) | uni-app pages are statically declared by `pages.json` |
| Nested routes (`<router-view>`) | uni-app has no nested view components |
| Dynamic path matching (`/user/:id`) | uni-app page paths are fixed |
| `router.go(n)` / `router.forward()` | Mini-programs don't support forward navigation |
| Named views | uni-app has no multi-view support |
| Route lazy loading | uni-app has its own code splitting mechanism |
| History mode selection | uni-app uses different routing modes per platform |

These limitations stem from the uni-app framework's design, not from this library. See [Differences from vue-router](./differences).

## Next Steps

- [Getting Started](./getting-started) — Integrate into your project in minutes
- [Navigation](./navigation) — Deep dive into the four navigation methods
- [Route Guards](./guards) — Understand guard mechanism and practices
- [Navigation Flow](./navigation-flow) — Understand the complete navigation process from source code perspective
