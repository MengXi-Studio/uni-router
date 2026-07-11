import type { RouterPlugin, PluginContext } from '@/plugin'
import type { RouteLocationRaw, NavigationAnimation, RouterOptions } from '@/types'

/**
 * AnimationPlugin 插件数据键
 */
const PLUGIN_DATA_KEY = 'animation'

/**
 * 从原始路由位置中提取动画参数
 *
 * resolve() 会丢弃 animation 字段，因此需要在解析前提取。
 * 字符串形式的路由位置不包含动画参数。
 */
function extractAnimation(location: RouteLocationRaw): NavigationAnimation | undefined {
	if (typeof location === 'string') return undefined
	if (typeof location === 'object' && 'animation' in location) return (location as { animation?: NavigationAnimation }).animation
	return undefined
}

/**
 * AnimationPlugin - 导航动画插件
 *
 * 提供导航动画配置能力：
 * - 从路由位置中提取 animation 参数
 * - 在 prepareNavigation 阶段将动画设置到 navOptions
 * - 通过模块增强为 back() 的 options 添加 animation 字段
 */
export const AnimationPlugin: RouterPlugin = {
	name: 'animation',

	install(context: PluginContext, _options: RouterOptions) {
		// onAfterResolve: 从 enrichedLocation 中提取 animation，存入 pluginData
		context.onAfterResolve((enrichedLocation, pluginData) => {
			const animation = extractAnimation(enrichedLocation)
			if (animation) {
				pluginData[PLUGIN_DATA_KEY] = { animation }
			}
		})

		// onPrepareNavigation: 将动画设置到 navOptions
		context.onPrepareNavigation(ctx => {
			const data = ctx.pluginData[PLUGIN_DATA_KEY]
			if (data?.animation) {
				ctx.options.animation = data.animation
			}
		})
	}
}
