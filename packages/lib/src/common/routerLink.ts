import { RouteLocationRaw } from '@/types'

/** 路由链接组件 Props */
export interface RouterLinkProps {
	/** 路由地址 */
	to: RouteLocationRaw
	/** 跳转方式 */
	method?: 'push' | 'replace' | 'tab' | 'launch' | 'back' | 'exit'
	/** 回退层数 */
	delta?: number
	/** 窗口动画类型 */
	animationType?: 'slide-in-right' | 'slide-in-left' | 'slide-in-top' | 'slide-in-bottom' | 'pop-in' | 'fade-in' | 'zoom-out' | 'zoom-fade-out' | 'none'
	/** 动画持续时间 */
	animationDuration?: number
	/** 是否给 navigator 组件加一层 a 标签控制 ssr 渲染 */
	renderLink?: boolean
	/** 指定点击时的样式类，当hover-class="none"时，没有点击态效果 */
	hoverClass?: string
	/** 指定是否阻止本节点的祖先节点出现点击态 */
	hoverStopPropagation?: boolean
	/** 按住后多久出现点击态，单位毫秒 */
	hoverStartTime?: number
	/** 手指松开后点击态保留时间，单位毫秒 */
	hoverStayTime?: number
	/** 在哪个小程序目标上发生跳转，默认当前小程序，值域self/miniProgram */
	target?: 'miniProgram' | 'self'
}

/** 路由链接组件的方法 */
export interface RouterLinkActionType {
	setProps: (routerLinkProps: RouterLinkProps) => Promise<void>
}

/** 路由链接组件的 emit 类型 */
export type RouterLinkEmits = {
	(e: 'register', instance: RouterLinkActionType): void
}
