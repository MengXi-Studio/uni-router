<template>
	<view class="container">
		<view class="section">
			<view class="section-title">router.push() - 导航到新页面</view>
			<view class="info-text">对应 uni.navigateTo，将新页面压入页面栈</view>
			<view class="btn" @click="pushByPath">push - 路径字符串</view>
			<view class="btn btn-success" @click="pushByPathObj">push - 路径对象</view>
			<view class="btn btn-warn" @click="pushByNameObj">push - 命名路由对象</view>
			<view class="code-block">
				// 路径字符串\nrouter.push('/pages/detail/detail')\n\n// 路径对象\nrouter.push({ path: '/pages/detail/detail', query: { id: '1' } })\n\n// 命名路由对象\nrouter.push({ name: 'pagesDetailDetail', query: { id: '2' }
				})
			</view>
		</view>

		<view class="section">
			<view class="section-title">router.replace() - 替换当前页面</view>
			<view class="info-text">对应 uni.redirectTo，关闭当前页面再跳转</view>
			<view class="btn btn-warn" @click="replaceByPath">replace - 路径字符串</view>
			<view class="btn btn-danger" @click="replaceByName">replace - 命名路由</view>
			<view class="code-block"> router.replace('/pages/about/about')\nrouter.replace({ name: 'pagesAboutAbout' }) </view>
		</view>

		<view class="section">
			<view class="section-title">router.back() - 返回上一页（执行守卫链）</view>
			<view class="info-text">对应 uni.navigateBack，执行完整的 beforeEach → beforeResolve 守卫链，守卫可中止或重定向返回操作。</view>
			<view class="btn btn-gray" @click="goBack">返回上一页 (delta=1)</view>
			<view class="btn btn-danger" @click="goBackWithError">测试：back() 被守卫中止</view>
			<view class="code-block"> router.back() // 执行完整守卫链后返回\nrouter.back(2) // 返回2层\n\n// 守卫可中止返回\nrouter.beforeEach((to, from, next) => {\n next(false) // 中止返回\n}) </view>
		</view>

		<view class="section">
			<view class="section-title">router.relaunch() - 关闭所有页面并打开目标页面</view>
			<view class="info-text">对应 uni.reLaunch，关闭所有页面后打开目标页面，常用于退出登录、返回首页等场景。TabBar 页面自动切换为 switchTab。</view>
			<view class="btn" @click="relaunchByPath">relaunch - 路径字符串</view>
			<view class="btn btn-warn" @click="relaunchByObj">relaunch - 路径对象（带参数）</view>
			<view class="btn btn-success" @click="relaunchTabBar">relaunch - TabBar 页面</view>
			<view class="code-block">
				router.relaunch('/pages/index/index')\nrouter.relaunch({ path: '/pages/detail/detail', query: { from: 'relaunch' } })\nrouter.relaunch({ name: 'pagesAboutAbout' }) // 自动 switchTab
			</view>
		</view>

		<view class="section">
			<view class="section-title">params - 页面参数传递</view>
			<view class="info-text">params 支持传递复杂数据（对象、数组等），不暴露在 URL 中，目标页面通过 route.params 读取。</view>
			<view class="btn" @click="pushWithParams">push - 带 params 跳转</view>
			<view class="btn btn-success" @click="pushWithParamsPersistent">push - params 持久化存储</view>
			<view class="code-block">
				// 传递 params\nawait router.push({\n path: '/pages/detail/detail',\n query: { id: '1' },\n params: { userInfo: { name: 'Tom', age: 20 } }\n})\n\n// 目标页面读取\nconst route =
				useRoute()\nconsole.log(route.params.userInfo) // { name: 'Tom', age: 20 }\n\n// 持久化存储（H5 刷新后仍可读取）\nawait router.push({\n path: '/pages/detail/detail',\n params: { bigData: largeObject },\n
				persistent: true\n})
			</view>
		</view>

		<view class="section">
			<view class="section-title">查询参数增强 - queryInt / queryNumber / queryBool</view>
			<view class="info-text">RouteLocation 提供三个便捷方法，自动解析 query 参数为指定类型。</view>
			<view class="btn" @click="pushWithNumericQuery">push - 数值类型查询参数</view>
			<view class="btn btn-success" @click="pushWithBoolQuery">push - 布尔类型查询参数</view>
			<view class="code-block">
				// URL: /pages/detail/detail?id=123&price=19.99\nroute.queryInt('id') // 123\nroute.queryNumber('price') // 19.99\n\n// URL: /pages/detail/detail?enabled=true\nroute.queryBool('enabled') // true\n\n//
				带默认值\nroute.queryInt('page', 1) // 1（参数不存在时）
			</view>
		</view>

		<view class="section">
			<view class="section-title">TabBar 页面导航</view>
			<view class="info-text">TabBar 页面使用 push/replace 均会自动调用 switchTab</view>
			<view class="btn btn-success" @click="goTabBar">跳转到关于页 (TabBar)</view>
		</view>

		<view class="section">
			<view class="section-title">导航动画（仅 App 端生效）</view>
			<view class="info-text">通过 animation 参数控制页面切换动画，优先级：调用时传入 > meta.animation > uni 默认值</view>
			<view class="btn" @click="pushWithAnimation">push - 底部滑入动画</view>
			<view class="btn btn-success" @click="backWithAnimation">back - 左侧滑出动画</view>
			<view class="code-block"> router.push({ path: '/pages/detail/detail', animation: { type: 'slide-in-bottom' } })\nrouter.back(1, { type: 'slide-out-left', duration: 500 }) </view>
		</view>

		<view class="section">
			<view class="section-title">EventChannel - 页面间通信</view>
			<view class="info-text">push 支持 events 参数和 eventChannel 返回值，实现页面间双向通信</view>
			<view class="btn" @click="goEventChannel">查看 EventChannel 演示</view>
			<view class="code-block">
				const { eventChannel } = await router.push({\n path: '/pages/detail/detail',\n events: {\n receiveData: (data) => console.log(data)\n }\n})\neventChannel.emit('fromOpener', { msg: 'hello' })
			</view>
		</view>

		<view class="section">
			<view class="section-title">RouterLink 组件</view>
			<view class="info-text">使用 RouterLink 组件进行声明式导航，支持 @error 事件捕获导航失败。</view>
			<RouterLink to="/pages/detail/detail" custom>
				<view class="btn">RouterLink - 路径跳转</view>
			</RouterLink>
			<RouterLink :to="{ name: 'pagesDetailDetail', query: { id: 'link' } }" custom>
				<view class="btn btn-warn">RouterLink - 命名路由</view>
			</RouterLink>
			<RouterLink to="/pages/about/about" replace custom>
				<view class="btn btn-danger">RouterLink - replace 模式</view>
			</RouterLink>
			<RouterLink to="/pages/error/error" custom @error="onRouterLinkError">
				<view class="btn btn-gray">RouterLink - 带 error 事件</view>
			</RouterLink>
			<RouterLink to="/pages/index/index" relaunch custom>
				<view class="btn btn-danger">RouterLink - relaunch 模式</view>
			</RouterLink>
		</view>

		<view class="section">
			<view class="section-title">RouterLink - animation 属性</view>
			<view class="info-text">通过 animation 属性控制导航动画（仅 App 端生效），覆盖 meta.animation。</view>
			<RouterLink to="/pages/detail/detail" :animation="{ type: 'slide-in-bottom' }" custom>
				<view class="btn">RouterLink - 底部滑入动画</view>
			</RouterLink>
			<view class="code-block"> {{ linkAnimationCode }} </view>
		</view>

		<view class="section">
			<view class="section-title">RouterLink - params 与 persistent</view>
			<view class="info-text">通过 params 属性传递复杂数据，通过 persistent 属性控制是否持久化到 storage。</view>
			<RouterLink :to="{ path: '/pages/detail/detail', query: { id: 'link-params' } }" :params="{ orderInfo: { orderId: 'A001', amount: 99.9 } }" custom>
				<view class="btn">RouterLink - 带 params 跳转</view>
			</RouterLink>
			<RouterLink :to="{ path: '/pages/detail/detail', query: { id: 'link-persistent' } }" :params="{ config: { theme: 'dark' } }" persistent custom>
				<view class="btn btn-success">RouterLink - params 持久化</view>
			</RouterLink>
			<view class="code-block"> {{ linkParamsCode }} </view>
		</view>

		<view class="section">
			<view class="section-title">RouterLink - events 与 navigated</view>
			<view class="info-text">通过 events 属性监听目标页面事件，通过 @navigated 获取 eventChannel 向目标页面发送数据。</view>
			<RouterLink :to="{ path: '/pages/detail/detail', query: { id: 'link-ec' } }" :events="{ receiveData: data => onReceiveData(data) }" custom @navigated="onNavigated" @error="onRouterLinkError">
				<view class="btn btn-success">RouterLink - events + navigated</view>
			</RouterLink>
			<view class="code-block">
				{{ linkEventsCode }}
			</view>
			<view v-if="routerLinkLog" class="info-text" style="color: #34c759">{{ routerLinkLog }}</view>
		</view>

		<view class="section">
			<view class="section-title">interceptUniApi - 拦截 uni 原生导航 API</view>
			<view class="info-text">
				启用 interceptUniApi 后，直接调用 uni.navigateTo / uni.redirectTo / uni.switchTab / uni.reLaunch / uni.navigateBack 将被拦截，自动转为 router.push / replace / relaunch / back，确保路由守卫始终生效。
			</view>
			<view class="btn" @click="interceptedNavigateTo">uni.navigateTo（被拦截转为 push）</view>
			<view class="btn btn-warn" @click="interceptedRedirectTo">uni.redirectTo（被拦截转为 replace）</view>
			<view class="btn btn-success" @click="interceptedSwitchTab">uni.switchTab（被拦截转为 push）</view>
			<view class="btn btn-danger" @click="interceptedReLaunch">uni.reLaunch（被拦截转为 relaunch）</view>
			<view class="btn btn-gray" @click="interceptedNavigateBack">uni.navigateBack（被拦截转为 back）</view>
			<view class="info-text" style="color: #ff9500; margin-top: 16rpx">
				⚠️ H5 平台特殊处理：在 H5 平台下，uni.switchTab 不会被拦截转为 push，而是放行原始调用并在 success 回调中同步路由状态。这是因为同步阻止 switchTab 会导致 H5 TabBar 组件状态卡死。因此 H5 平台下外部 uni.switchTab
				调用不经过前置守卫，TabBar 页面的权限控制需在页面 onShow 生命周期中处理。小程序和 App 平台则走完整的拦截 + 转发流程。
			</view>
			<view class="code-block">
				// 启用 interceptUniApi: true 后\nuni.navigateTo({ url: '/pages/detail/detail?id=1' })\n// => 自动转为 router.push({ path: '/pages/detail/detail', query: { id: '1' } })\n// 守卫链（beforeEach → beforeResolve →
				afterEach）照常执行\n\nuni.navigateBack({ delta: 1 })\n// => 自动转为 router.back(1)，执行完整守卫链\n\n// H5 平台下的 switchTab 特殊处理\nuni.switchTab({ url: '/pages/index/index' })\n// 小程序/App: 拦截转为
				router.push，守卫正常执行\n// H5: 放行原始调用，在 success 中 syncRoute()，不经过守卫
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, NavigationFailure, RouterErrorCode, type EventChannel } from '@meng-xi/uni-router'
import RouterLink from '@meng-xi/uni-router/components/RouterLink.vue'

const router = useRouter()
const routerLinkLog = ref('')

// 代码示例：含 < > 的文本需通过插值输出，避免小程序 WXML 编译器误解析为标签
const linkAnimationCode = `<RouterLink to="/pages/detail/detail" :animation="{ type: 'slide-in-bottom' }"> 底部滑入 </RouterLink>`
const linkParamsCode = `<RouterLink\\n :to="{ path: '/pages/detail/detail' }"\\n :params="{ orderInfo: { orderId: 'A001' } }"\\n persistent\\n>\\n 持久化参数跳转\\n</RouterLink>`
const linkEventsCode = `<RouterLink\\n :to="{ path: '/pages/detail/detail', query: { id: '1' } }"\\n :events="{ receiveData: (data) => console.log(data) }"\\n @navigated="onNavigated"\\n>\\n 查看详情\\n</RouterLink>`

function onReceiveData(data: Record<string, unknown>) {
	routerLinkLog.value = `收到详情页数据: ${JSON.stringify(data)}`
	uni.showToast({ title: `收到: ${data.msg || JSON.stringify(data)}`, icon: 'none' })
}

function onNavigated(eventChannel: EventChannel | undefined) {
	if (eventChannel) {
		eventChannel.emit('fromOpener', { msg: '来自 RouterLink 的 navigated 事件' })
		routerLinkLog.value = '已通过 eventChannel 发送消息到详情页'
	}
}

function pushByPath() {
	router.push('/pages/detail/detail')
}

function pushByPathObj() {
	router.push({ path: '/pages/detail/detail', query: { id: '1', method: 'path-obj' } })
}

function pushByNameObj() {
	router.push({ name: 'pagesDetailDetail', query: { id: '2', method: 'name-obj' } })
}

function replaceByPath() {
	router.replace('/pages/about/about')
}

function replaceByName() {
	router.replace({ name: 'pagesAboutAbout' })
}

function goBack() {
	router.back().catch((error: NavigationFailure) => {
		if (error.code === RouterErrorCode.NAVIGATION_ABORTED || error.code === RouterErrorCode.NAVIGATION_CANCELLED) {
			uni.showToast({ title: '返回被守卫中止', icon: 'none' })
		}
	})
}

function goBackWithError() {
	const removeGuard = router.beforeEach((_to, _from, next) => {
		uni.showToast({ title: '返回被守卫中止', icon: 'none' })
		next(false)
		removeGuard()
	})
	router.back().catch(() => {})
}

function goTabBar() {
	router.push({ name: 'pagesAboutAbout' })
}

function relaunchByPath() {
	router.relaunch('/pages/index/index')
}

function relaunchByObj() {
	router.relaunch({ path: '/pages/detail/detail', query: { id: 'relaunch', from: 'relaunch' } })
}

function relaunchTabBar() {
	router.relaunch({ name: 'pagesAboutAbout' })
}

function pushWithAnimation() {
	router.push({ path: '/pages/detail/detail', query: { id: 'anim' }, animation: { type: 'slide-in-bottom' } })
}

function backWithAnimation() {
	router.back(1, { type: 'slide-out-left', duration: 500 })
}

function pushWithParams() {
	router.push({
		path: '/pages/detail/detail',
		query: { id: 'params-demo' },
		params: { userInfo: { name: 'Tom', age: 20 }, tags: ['vip', 'active'] }
	})
}

function pushWithParamsPersistent() {
	router.push({
		path: '/pages/detail/detail',
		query: { id: 'persistent-demo' },
		params: { bigData: { items: [1, 2, 3], total: 3 } },
		persistent: true
	})
}

function pushWithNumericQuery() {
	router.push({
		path: '/pages/detail/detail',
		query: { id: 123, price: 19.99 }
	})
}

function pushWithBoolQuery() {
	router.push({
		path: '/pages/detail/detail',
		query: { id: 'bool-demo', enabled: true, visible: false }
	})
}

function goEventChannel() {
	router.push({ name: 'pagesEventChannelEventChannel' })
}

// ===== interceptUniApi 拦截演示 =====
// 启用 interceptUniApi: true 后，直接调用 uni 原生导航 API 会被拦截并转为路由器方法
function interceptedNavigateTo() {
	// 会被拦截，自动转为 router.push({ path: '/pages/detail/detail', query: { id: 'intercepted' } })
	uni.navigateTo({ url: '/pages/detail/detail?id=intercepted' })
}

function interceptedRedirectTo() {
	// 会被拦截，自动转为 router.replace({ path: '/pages/about/about' })
	uni.redirectTo({ url: '/pages/about/about' })
}

function interceptedSwitchTab() {
	// 小程序/App: 会被拦截，自动转为 router.push('/pages/index/index')
	// H5: 放行原始调用，在 success 中 syncRoute()，不经过守卫
	uni.switchTab({ url: '/pages/index/index' })
}

function interceptedReLaunch() {
	// 会被拦截，自动转为 router.relaunch({ path: '/pages/index/index' })
	uni.reLaunch({ url: '/pages/index/index' })
}

function interceptedNavigateBack() {
	// 会被拦截，自动转为 router.back(1)，执行完整守卫链
	uni.navigateBack({ delta: 1 })
}

function onRouterLinkError(error: NavigationFailure) {
	uni.showToast({ title: `导航失败: ${error.code}`, icon: 'none' })
}
</script>
