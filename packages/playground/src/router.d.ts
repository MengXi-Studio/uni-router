import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteNameMap {
    /** 首页 - uni-router 演示 */
    pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string; isTab: true } }
    /** 路由导航 */
    pagesNavigationNavigation: { path: '/pages/navigation/navigation'; meta: { title: string } }
    /** 路由守卫 */
    pagesGuardsGuards: { path: '/pages/guards/guards'; meta: { title: string } }
    /** 详情页 */
    pagesDetailDetail: { path: '/pages/detail/detail'; meta: { title: string } }
    /** 受保护页面 */
    pagesProtectedProtected: { path: '/pages/protected/protected'; meta: { title: string; requireAuth: true } }
    /** 登录 */
    pagesLoginLogin: { path: '/pages/login/login'; meta: { title: string } }
    /** 关于 */
    pagesAboutAbout: { path: '/pages/about/about'; meta: { title: string; isTab: true; animation: unknown } }
    /** 路由解析 */
    pagesResolveResolve: { path: '/pages/resolve/resolve'; meta: { title: string } }
    /** 错误处理 */
    pagesErrorError: { path: '/pages/error/error'; meta: { title: string } }
    /** 个人中心 */
    pagesSubProfileProfile: { path: '/pages-sub/profile/profile'; meta: { title: string } }
    /** 设置 */
    pagesSubSettingsSettings: { path: '/pages-sub/settings/settings'; meta: { title: string; requireAuth: true } }
  }
}