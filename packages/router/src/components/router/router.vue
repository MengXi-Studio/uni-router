<template>
	<navigator
		:url="url"
		:open-type="openType"
		:delta="getProps.delta"
		:animation-type="getProps.animationType"
		:animation-duration="getProps.animationDuration"
		:render-link="getProps.renderLink"
		:hover-class="getProps.hoverClass"
		:hover-stop-propagation="getProps.hoverStopPropagation"
		:hover-start-time="getProps.hoverStartTime"
		:hover-stay-time="getProps.hoverStayTime"
		:target="getProps.target">
		<slot></slot>
	</navigator>
</template>

<script>
import { parseLocation, buildUrl, deepMerge } from './utils.js'

/**
 * @description 路由链接组件
 *
 * @param {string | object} to 目标路由位置信息
 * @param {string} method 跳转类型
 * @param {number} delta 页面栈层数
 * @param {string} animationType 动画类型
 * @param {number} animationDuration 动画持续时间
 * @param {boolean} renderLink 是否渲染链接
 * @param {string} hoverClass 悬停类名
 * @param {boolean} hoverStopPropagation 是否阻止悬停事件冒泡
 * @param {number} hoverStartTime 悬停开始时间
 * @param {number} hoverStayTime 悬停持续时间
 * @param {string} target 目标窗口
 */
export default {
	name: 'RouterLink',
	props: {
		to: [String, Object],
		method: {
			type: String,
			default: 'push'
		},
		delta: Number,
		// #ifdef APP
		animationType: {
			type: String,
			default: 'none'
		},
		animationDuration: {
			type: Number,
			default: 300
		},
		// #endif
		// #ifdef WEB || APP-NVUE
		renderLink: {
			type: Boolean,
			default: true
		},
		// #endif
		hoverClass: {
			type: String,
			default: 'none'
		},
		// #ifdef MP-WEIXIN
		hoverStopPropagation: {
			type: Boolean,
			default: false
		},
		// #endif
		hoverStartTime: {
			type: Number,
			default: 50
		},
		hoverStayTime: {
			type: Number,
			default: 600
		},
		// #ifdef MP-WEIXIN || MP-BAIDU || MP-QQ
		target: {
			type: String,
			default: 'self'
		}
		// #endif
	},
	emits: ['register'],
	data() {
		return {
			/** 函数注册的组件 props */
			propsRef: {},
			/** 路由跳转的 URL */
			url: '',
			/** 跳转类型 */
			openType: ''
		}
	},
	computed: {
		/** 合并后的 props */
		getProps() {
			return { ...this.$props, ...this.propsRef }
		}
	},
	watch: {
		getProps: {
			immediate: true,
			handler(val) {
				const { to, method } = val

				// 解析目标路由位置信息，获取路径和查询参数
				const { path, query } = parseLocation(to || '')

				// 构建目标路由位置信息
				this.url = buildUrl(path, query)

				// 获取跳转类型
				this.openType = this.getOpenType(method)
			},
			deep: true
		}
	},
	mounted() {
		this.$emit('register', {
			setProps: this.setProps
		})
	},
	methods: {
		/**
		 * 获取跳转类型
		 * @param method 跳转类型
		 * @returns 跳转类型
		 */
		getOpenType(method) {
			switch (method) {
				case 'push':
					return 'navigate'

				case 'replace':
					return 'redirect'

				case 'tab':
					return 'switchTab'

				case 'launch':
					return 'reLaunch'

				case 'back':
					return 'navigateBack'

				default:
					return 'exit'
			}
		},

		/**
		 * 设置组件的 props，合并传入的 props 并过滤掉组件定义中不存在的属性
		 *
		 * @param {Object} routerLinkProps - 要设置的 RouterLink props 对象
		 */
		setProps(routerLinkProps) {
			// 合并props
			const props = deepMerge(this.propsRef || {}, routerLinkProps)
			// 获取组件定义的 props 键名
			const validProps = Object.keys(this.$props)
			// 过滤props上不存在的属性
			this.propsRef = Object.fromEntries(Object.entries(props).filter(([key]) => validProps.includes(key)))
		}
	}
}
</script>
