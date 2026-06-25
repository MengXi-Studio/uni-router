<template>
	<view class="container">
		<view class="section">
			<view class="section-title">错误处理概述</view>
			<view class="info-text">
				uni-router 通过
				<text class="tag tag-red">RouterError</text>
				和
				<text class="tag tag-red">NavigationFailure</text>
				两类错误对象描述路由过程中的异常，可通过 router.onError() 统一捕获。
			</view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_DUPLICATED - 重复导航</view>
			<view class="info-text">导航到当前已在的页面时抛出，避免冗余导航。</view>
			<view class="btn btn-danger" @click="testDuplicate">测试重复导航</view>
			<view class="code-block"> // 当前已在 /pages/error/error 页面\nrouter.push('/pages/error/error')\n// => NavigationFailure: NAVIGATION_DUPLICATED </view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_ABORTED - 导航被守卫中止</view>
			<view class="info-text">守卫中调用 next(false) 中止导航时抛出。</view>
			<view class="btn btn-danger" @click="testAborted">测试中止导航</view>
			<view class="code-block"> router.beforeEach((to, from, next) => {\n next(false) // 中止导航\n})\n// => NavigationFailure: NAVIGATION_ABORTED </view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_CANCELLED - 导航被取消</view>
			<view class="info-text">守卫超时未调用 next()、守卫抛出异常、重定向超限、或 back() 页面栈不足时抛出。</view>
			<view class="btn btn-warn" @click="testCancelledTimeout">测试：守卫超时</view>
			<view class="btn btn-danger" @click="testCancelledException">测试：守卫抛出异常</view>
			<view class="btn btn-gray" @click="testCancelledBackStack">测试：back() 栈不足</view>
			<view class="code-block">
				// 1. 守卫超时（guardTimeout）\nrouter.beforeEach(async (to, from, next) => {\n await verySlowOperation() // 超时\n next()\n})\n// => NAVIGATION_CANCELLED\n\n// 2. 守卫抛出未捕获异常\nrouter.beforeEach(() => {\n
				throw new Error('guard error')\n})\n// => NAVIGATION_CANCELLED\n\n// 3. back() 页面栈不足\nrouter.back(10) // 当前栈仅 1-2 层\n// => NAVIGATION_CANCELLED
			</view>
		</view>

		<view class="section">
			<view class="section-title">NAVIGATION_API_ERROR - uni API 调用失败</view>
			<view class="info-text">uni.navigateTo 等原生 API 调用失败时抛出，cause 携带失败的 API 信息（UniApiError）。</view>
			<view class="btn btn-danger" @click="testApiError">测试：模拟 API 失败</view>
			<view v-if="apiErrorLog" class="code-block">{{ apiErrorLog }}</view>
			<view class="code-block">
				// NavigationFailure.cause 为 UniApiError\ninterface UniApiError {\n readonly api: string // 'navigateTo' 等\n readonly cause: UniApiCause // { errMsg: string }\n}\n\n// 小程序页面栈达 10 层上限时\nawait
				router.push({ name: 'page11' })\n// err.code === 'NAVIGATION_API_ERROR'\n// err.cause.api === 'navigateTo'\n// err.cause.cause.errMsg 包含 'limit exceed'
			</view>
		</view>

		<view class="section">
			<view class="section-title">ROUTE_NOT_FOUND - 路由未找到</view>
			<view class="info-text">严格模式下，解析未注册的路由时抛出。</view>
			<view class="btn btn-danger" @click="testNotFound">测试未找到路由</view>
			<view class="code-block"> // 严格模式 (strict: true)\nrouter.resolve('/non/existent/path')\n// => RouterError: ROUTE_NOT_FOUND </view>
		</view>

		<view class="section">
			<view class="section-title">router.onError() - 统一错误处理</view>
			<view class="info-text">所有导航错误都会触发 onError 回调，本应用在 main.ts 中已注册。</view>
			<view class="code-block">
				router.onError((error, to, from) => {\n if (error instanceof NavigationFailure) {\n switch (error.code) {\n case 'NAVIGATION_ABORTED': ...\n case 'NAVIGATION_CANCELLED': ...\n case 'NAVIGATION_DUPLICATED': ...\n
				case 'NAVIGATION_API_ERROR':\n console.error(error.cause) // UniApiError\n break\n }\n }\n})
			</view>
		</view>

		<view class="section">
			<view class="section-title">错误码一览</view>
			<view class="code-block">
				enum RouterErrorCode {\n NAVIGATION_ABORTED // 导航被守卫中止（next(false)）\n NAVIGATION_CANCELLED // 导航被取消（超时/异常/重定向超限/栈不足）\n NAVIGATION_DUPLICATED // 重复导航\n ROUTE_NOT_FOUND //
				路由未找到\n NAVIGATION_API_ERROR // uni API 调用失败\n SETUP_ERROR // 初始化错误\n}
			</view>
		</view>

		<view class="btn btn-gray" @click="goBack">返回上一页</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, NavigationFailure, RouterError, RouterErrorCode } from '@meng-xi/uni-router'

const router = useRouter()
const apiErrorLog = ref('')

async function testDuplicate() {
	try {
		await router.push('/pages/error/error')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_DUPLICATED) {
			uni.showToast({ title: '捕获重复导航错误', icon: 'none' })
		}
	}
}

async function testAborted() {
	const removeGuard = router.beforeEach((to, _from, next) => {
		if (to.path === '/pages/about/about') {
			next(false)
			removeGuard()
			return
		}
		next()
	})

	try {
		await router.push('/pages/about/about')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_ABORTED) {
			uni.showToast({ title: '捕获导航中止错误', icon: 'none' })
		}
	}
}

async function testCancelledTimeout() {
	const removeGuard = router.beforeEach(() => {
		// 故意不调用 next()，等待超时
		uni.showToast({ title: '守卫未调用 next()，等待超时...', icon: 'none' })
		setTimeout(() => {
			removeGuard()
		}, 1000)
	})

	try {
		await router.push('/pages/about/about')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_CANCELLED) {
			uni.showToast({ title: '捕获导航取消（超时）', icon: 'none' })
		}
	}
}

async function testCancelledException() {
	const removeGuard = router.beforeEach(() => {
		// 抛出未捕获异常，转为 NAVIGATION_CANCELLED
		throw new Error('守卫内部异常')
	})

	try {
		await router.push('/pages/about/about')
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_CANCELLED) {
			uni.showToast({ title: '捕获导航取消（异常）', icon: 'none' })
		}
	} finally {
		removeGuard()
	}
}

async function testCancelledBackStack() {
	try {
		// 当前页面栈可能不足，back(10) 会触发 NAVIGATION_CANCELLED
		await router.back(10)
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_CANCELLED) {
			uni.showToast({ title: '捕获导航取消（栈不足）', icon: 'none' })
		}
	}
}

async function testApiError() {
	apiErrorLog.value = ''
	// 注册一次性守卫放行导航，然后用一个不存在的 path 让 uni API 失败
	// 实际场景：小程序页面栈溢出时 navigateTo 失败
	// 此处通过拦截 uni.navigateTo 模拟 API 失败
	const originalNavigateTo = uni.navigateTo
	;(uni as any).navigateTo = (_options: any) => {
		// 模拟 uni API 失败回调
		const fail = { errMsg: 'navigateTo:fail mock api error' }
		uni.navigateTo = originalNavigateTo
		if (_options && _options.fail) {
			_options.fail(fail)
		}
	}

	try {
		await router.push({ path: '/pages/detail/detail', query: { id: 'api-error-test' } })
	} catch (error) {
		if (error instanceof NavigationFailure && error.code === RouterErrorCode.NAVIGATION_API_ERROR) {
			const cause = error.cause
			apiErrorLog.value = `code: ${error.code}\napi: ${cause?.api}\nerrMsg: ${cause?.cause.errMsg}`
			uni.showToast({ title: '捕获 API 错误', icon: 'none' })
		}
	} finally {
		// 确保恢复原始 API
		uni.navigateTo = originalNavigateTo
	}
}

function testNotFound() {
	try {
		router.resolve('/non/existent/path')
	} catch (error) {
		if (error instanceof RouterError && error.code === RouterErrorCode.ROUTE_NOT_FOUND) {
			uni.showToast({ title: '捕获路由未找到错误', icon: 'none' })
		}
	}
}

function goBack() {
	router.back()
}
</script>
