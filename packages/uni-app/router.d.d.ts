import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteNameMap {
    /** uni-app */
    pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string } }
    /** 路由守卫 */
    pagesGuardsIndex: { path: '/pages/guards/index'; meta: { title: string } }
    /** 关于 */
    pagesAboutIndex: { path: '/pages/about/index'; meta: { title: string } }
    /** 受保护页面 */
    pagesProtectedIndex: { path: '/pages/protected/index'; meta: { title: string; requireAuth: true } }
    /** 登录 */
    pagesLoginIndex: { path: '/pages/login/index'; meta: { title: string } }
  }
}