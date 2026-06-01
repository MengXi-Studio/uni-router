# 平台兼容性

MengXi UniRouter 基于 uni-app 原生导航 API 实现，兼容 uni-app 支持的所有目标平台。

## 支持的平台

| 平台 | push | replace | back | 守卫 | 元信息 |
|------|------|---------|------|------|--------|
| H5 | ✅ | ✅ | ✅ | ✅ | ✅ |
| iOS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android | ✅ | ✅ | ✅ | ✅ | ✅ |
| 微信小程序 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 支付宝小程序 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 百度小程序 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 字节跳动小程序 | ✅ | ✅ | ✅ | ✅ | ✅ |
| QQ 小程序 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 平台差异

### switchTab 不支持查询参数

所有平台的 `uni.switchTab` 均不支持传递查询参数。当导航到 TabBar 页面时传入 query，MengXi UniRouter 会输出警告并忽略参数：

```ts
router.push({ name: 'user', query: { tab: 'settings' } })
// ⚠️ uni.switchTab does not support query parameters. They will be ignored.
```

### replace 到 TabBar 页面

所有平台的 `uni.switchTab` 会关闭所有非 Tab 页面，而非仅替换当前页面：

```ts
router.replace({ name: 'user' })
// ⚠️ router.replace() to a tab page will close all non-tab pages instead of replacing the current page only
```

### getCurrentPages() 差异

- **H5**：页面栈从首页开始
- **小程序**：页面栈从当前小程序启动页面开始
- **App**：页面栈从应用启动页面开始

MengXi UniRouter 在初始化时通过 `getCurrentPages()` 获取当前页面信息，各平台行为一致。

## 不支持的 vue-router 特性

以下 vue-router 特性由于 uni-app 框架限制，在所有平台均不支持：

| 特性 | 原因 |
|------|------|
| `router.go(n)` | 小程序不支持前进导航 |
| `router.forward()` | 小程序不支持前进导航 |
| 动态路由注册 | uni-app 使用静态 pages.json |
| 嵌套路由 | uni-app 无嵌套视图组件 |
| 路由懒加载 | uni-app 有自己的代码分割机制 |

## 最佳实践

1. **TabBar 页面必须设置 `isTab: true`**：确保路由器使用正确的导航 API
2. **避免在 TabBar 页面导航时传递 query**：`switchTab` 不支持查询参数
3. **使用命名路由**：比路径字符串更安全，重构时只需修改路由配置
4. **在守卫中处理权限**：统一在 `beforeEach` 中进行权限校验
