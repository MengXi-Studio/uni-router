<template>
	<view class="container">
		<view class="section">
			<view class="section-title">路由守卫概述</view>
			<view class="info-text"> uni-router 提供三种全局守卫和一个路由独享守卫，确保导航过程中的完整控制。本应用在 main.ts 中注册了所有守卫，请打开控制台查看守卫执行日志。 </view>
		</view>

		<view class="section">
			<view class="section-title">beforeEach - 全局前置守卫</view>
			<view class="info-text">在每次导航前执行，可用于权限校验、登录检查等。</view>
			<view class="code-block"> router.beforeEach((to, from, next) => {\n if (to.meta.requireAuth && !isLoggedIn) {\n next({ name: 'pagesLoginLogin' })\n } else {\n next()\n }\n}) </view>
			<view class="btn btn-warn" @click="goProtected">测试：访问需登录页面</view>
		</view>

		<view class="section">
			<view class="section-title">beforeResolve - 全局解析守卫</view>
			<view class="info-text">在所有前置守卫和路由独享守卫完成后执行，适合做最终确认。</view>
			<view class="code-block"> router.beforeResolve((to, from, next) => {\n console.log('所有前置守卫已通过')\n next()\n}) </view>
		</view>

		<view class="section">
			<view class="section-title">afterEach - 全局后置钩子</view>
			<view class="info-text">导航完成后执行，适合做页面统计、标题设置等。</view>
			<view class="code-block"> router.afterEach((to, from) => {\n console.log('导航完成:', from.fullPath, '->', to.fullPath)\n}) </view>
		</view>

		<view class="section">
			<view class="section-title">beforeEnter - 路由独享守卫</view>
			<view class="info-text">定义在路由配置上，仅对该路由生效。本页配置了 beforeEnter 守卫。</view>
			<view class="code-block"> // 在路由配置中定义\n{\n path: '/pages/guards/guards',\n name: 'pagesGuardsGuards',\n beforeEnter: (to, from, next) => {\n console.log('[beforeEnter] 路由独享守卫')\n next()\n }\n} </view>
		</view>

		<view class="section">
			<view class="section-title">守卫重定向</view>
			<view class="info-text">在守卫中调用 next(newLocation) 可重定向到其他路由。</view>
			<view class="btn btn-danger" @click="testRedirect">测试：守卫重定向到首页</view>
		</view>

		<view class="section">
			<view class="section-title">守卫中止导航</view>
			<view class="info-text">在守卫中调用 next(false) 可中止当前导航。</view>
			<view class="btn btn-gray" @click="testAbort">测试：中止导航</view>
		</view>

		<view class="section">
			<view class="section-title">守卫超时保护</view>
			<view class="info-text">守卫未调用 next() 或抛出异常时，导航不会永久挂起。超时时间可通过 guardTimeout 配置（默认 10 秒，本应用设为 15 秒）。</view>
			<view class="btn btn-danger" @click="testTimeout">测试：守卫超时</view>
			<view class="code-block"> const router = createRouter({\n routes,\n guardTimeout: 15000 // 15秒超时\n}) </view>
		</view>

		<view class="section">
			<view class="section-title">guardRoute() - 冷启动守卫检查</view>
			<view class="info-text">
				当用户通过 H5 URL / 小程序场景值 / App deeplink 直接进入某个页面时，页面由 uni-app 框架直接加载，不经过路由器导航，守卫（beforeEach 等）未执行。guardRoute() 对当前已加载页面补执行守卫链。
			</view>
			<view class="info-text" style="color: #007aff; margin-top: 12rpx"> 本应用已在 App.vue 的 onLaunch 中调用 guardRoute()，冷启动进入受保护页面时将自动重定向到首页。 </view>
			<view class="btn" @click="testGuardRoute">测试：对当前路由执行 guardRoute()</view>
			<view class="btn btn-warn" @click="testGuardRouteAbort">测试：guardRoute() 被守卫中止</view>
			<view class="code-block">
				// App.vue onLaunch 中\nrouter.isReady().then(() => {\n router.guardRoute(undefined, {\n onAbort: (failure) => {\n // 守卫中止，跳转到安全页面\n router.relaunch({ name: 'home' })\n }\n })\n})\n\n//
				手动调用：检查指定路由\nawait router.guardRoute({ name: 'pagesProtectedProtected' }, {\n onAbort: () => console.log('被中止')\n})
			</view>
			<view v-if="guardRouteLog" class="info-text" style="color: #34c759; margin-top: 12rpx">{{ guardRouteLog }}</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, NavigationFailure, RouterErrorCode } from '@meng-xi/uni-router'

const router = useRouter()
const guardRouteLog = ref('')

function goProtected() {
	router.push({ name: 'pagesProtectedProtected' }).catch(error => {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
			uni.showToast({ title: '已在当前页面，无需重复导航', icon: 'none' })
		}
	})
}

function testRedirect() {
	// beforeEach 守卫会将未登录用户重定向到登录页
	router.push({ name: 'pagesProtectedProtected' }).catch(error => {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
			uni.showToast({ title: '已在受保护页面，守卫不会触发重定向', icon: 'none' })
		}
	})
}

function testAbort() {
	// 动态注册一个一次性守卫来中止导航
	const removeGuard = router.beforeEach((to, _from, next) => {
		if (to.name === 'pagesDetailDetail') {
			uni.showToast({ title: '导航已被守卫中止', icon: 'none' })
			next(false)
			removeGuard()
			return
		}
		next()
	})
	router.push({ name: 'pagesDetailDetail' }).catch(() => {
		// 守卫中止导航时产生的 NavigationFailure 已在 onError 中处理
	})
}

function testTimeout() {
	// 注册一个不调用 next() 的守卫，模拟超时
	const removeGuard = router.beforeEach(() => {
		// 故意不调用 next()，等待超时
		uni.showToast({ title: '守卫未调用 next()，等待超时...', icon: 'none' })
		setTimeout(() => {
			removeGuard()
		}, 1000)
	})
	router.push({ name: 'pagesDetailDetail' }).catch(() => {})
}

function testGuardRoute() {
	guardRouteLog.value = ''
	router
		.guardRoute()
		.then(route => {
			guardRouteLog.value = `守卫放行，当前路由: ${route.fullPath}`
			uni.showToast({ title: '守卫检查通过', icon: 'none' })
		})
		.catch(() => {
			// onAbort 或 onError 已处理
		})
}

function testGuardRouteAbort() {
	guardRouteLog.value = ''
	// 动态注册一次性守卫来中止 guardRoute
	const removeGuard = router.beforeEach((_to, _from, next) => {
		next(false)
		removeGuard()
	})
	router
		.guardRoute(undefined, {
			onAbort: failure => {
				guardRouteLog.value = `守卫中止: ${failure.code}`
				uni.showToast({ title: `guardRoute 被中止: ${failure.code}`, icon: 'none' })
			}
		})
		.catch(() => {
			// onAbort 已处理
		})
}
</script>
