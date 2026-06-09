---
layout: home

title: '@meng-xi/uni-router'
titleTemplate: Uni Router 路由管理

hero:
  name: '@meng-xi/uni-router'
  text: uni-app 路由管理
  tagline: 为 uni-app (Vue 3) 提供类似 vue-router 风格的路由管理系统
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 了解更多
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/uni-router

features:
  - icon: 🧭
    title: 路由导航
    details: 支持 push / replace / back 等导航方式，自动识别 TabBar 页面并选择对应的 uni API
  - icon: 🛡️
    title: 路由守卫
    details: 提供全局前置守卫、解析守卫、后置钩子及路由独享守卫，支持权限控制和重定向
  - icon: 🔒
    title: API 拦截
    details: interceptUniApi 拦截原生 uni 导航 API，确保路由守卫始终生效，防止绕过守卫直接跳转
  - icon: 📋
    title: 路由元信息
    details: 完整支持 title、isTab、requireAuth 及自定义扩展字段，灵活管理页面属性
  - icon: 🔗
    title: 路由链接
    details: 提供 RouterLink 组件，支持声明式导航，兼容路径字符串、路径对象和命名对象
  - icon: 🌐
    title: 多端兼容
    details: 基于 uni-app 原生 API 实现，兼容 iOS、Android、H5、微信小程序、支付宝小程序等全平台
  - icon: 💪
    title: TypeScript 优先
    details: 完整的类型定义，提供良好的 IDE 智能提示和类型安全
  - icon: 🪝
    title: 组合式 API
    details: 提供 useRouter() 和 useRoute() 组合式函数，与 Vue 3 Composition API 无缝集成
---
