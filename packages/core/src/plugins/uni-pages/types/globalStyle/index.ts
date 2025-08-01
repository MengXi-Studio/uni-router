import { AnimationType, HEXColor } from '../common'

/** 设置默认页面的窗口表现 */
export interface GlobalStyle {
	/**
	 * 导航栏背景颜色（同状态栏背景色）
	 *
	 * @description APP与H5为#F8F8F8，小程序平台请参考相应小程序文档
	 *
	 * @default '#F8F8F8'
	 */
	navigationBarBackgroundColor?: HEXColor
	/**
	 * 导航栏标题颜色及状态栏前景颜色，仅支持 black/white
	 *
	 * @default 'black'
	 */
	navigationBarTextStyle?: 'black' | 'white'
	/**
	 * 导航栏标题文字内容
	 */
	navigationBarTitleText?: string
	/**
	 * 导航栏样式，仅支持 default/custom
	 *
	 * custom即取消默认的原生导航栏，需看 [使用注意](https://uniapp.dcloud.net.cn/collocation/pages.html#customnav)
	 *
	 * @description 微信小程序 7.0+、百度小程序、H5、App（2.0.3+）
	 *
	 * @default 'default'
	 */
	navigationStyle?: 'default' | 'custom'
	/**
	 * 下拉显示出来的窗口的背景色
	 *
	 * @description 微信小程序
	 *
	 * @default '#ffffff'
	 */
	backgroundColor?: HEXColor
	/**
	 * 下拉 loading 的样式，仅支持 dark / light
	 *
	 * @description 微信小程序
	 *
	 * @default 'dark'
	 */
	backgroundTextStyle?: 'dark' | 'light'
	/**
	 * 是否开启下拉刷新，详见 [页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html#lifecycle)
	 *
	 * @default false
	 */
	enablePullDownRefresh?: boolean
	/**
	 * 页面上拉触底事件触发时距页面底部距离，单位只支持px，详见 [页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html#lifecycle)
	 *
	 * @default 50
	 */
	onReachBottomDistance?: number
	/**
	 * 顶部窗口的背景色（bounce回弹区域）
	 *
	 * @description 仅 iOS 平台
	 *
	 * @default '#ffffff'
	 */
	backgroundColorTop?: HEXColor
	/**
	 * 底部窗口的背景色（bounce回弹区域）
	 *
	 * @description 仅 iOS 平台
	 *
	 * @default '#ffffff'
	 */
	backgroundColorBottom?: HEXColor
	/**
	 * 导航栏图片地址（替换当前文字标题）
	 *
	 * 支付宝小程序内必须使用https的图片链接地址
	 *
	 * @description 支付宝小程序、H5、APP
	 */
	titleImage?: string
	/**
	 * 导航栏整体（前景、背景）透明设置
	 *
	 * 支持 always 一直透明 / auto 滑动自适应 / none 不透明
	 *
	 * @description 支付宝小程序、H5、APP
	 *
	 * @default 'none'
	 */
	transparentTitle?: 'always' | 'auto' | 'none'
	/**
	 * 导航栏点击穿透
	 *
	 * @description 支付宝小程序、H5
	 *
	 * @default 'NO'
	 */
	titlePenetrate?: 'YES' | 'NO'
	/**
	 * 横屏配置，屏幕旋转设置
	 *
	 * 仅支持 auto / portrait / landscape 详见 [响应显示区域变化](https://developers.weixin.qq.com/miniprogram/dev/framework/view/resizable.html)
	 *
	 * @description App 2.4.7+、微信小程序、QQ小程序
	 *
	 * @default 'portrait'
	 */
	pageOrientation?: 'auto' | 'portrait' | 'landscape'
	/**
	 * 窗口显示的动画效果，详见：[窗口动画](https://uniapp.dcloud.net.cn/api/router.html#animation)
	 *
	 * @description App
	 *
	 * @default 'pop-in'
	 */
	animationType?: AnimationType
	/**
	 * 窗口显示动画的持续时间，单位为 ms
	 *
	 * @description App
	 *
	 * @default 300
	 */
	animationDuration?: number
	/**
	 * 设置编译到 App 平台的特定样式，配置项参考下方 [app-plus](https://uniapp.dcloud.net.cn/collocation/pages.html#app-plus)
	 *
	 * @description App
	 */
	'app-plus'?: object
}
