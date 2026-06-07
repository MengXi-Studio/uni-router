import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteNameMap {
    /** uni-app */
    pagesIndexIndex: { path: '/pages/index/index'; meta: { title: string } }
    /** 关于 */
    pagesAboutIndex: { path: '/pages/about/index'; meta: { title: string } }
  }
}