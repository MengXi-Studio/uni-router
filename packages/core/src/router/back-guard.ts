import type { RouteLocation } from '@/types'
import { RouterErrorCode } from '@/enums'
import { NavigationFailure } from '@/errors'
import { goBack } from '@/navigation'
import { getPlatform } from '@/utils'
import type { BackGuardDeps } from './type'

/**
 * 返回守卫管理器
 *
 * 负责拦截返回操作并执行返回守卫链：
 * - App 端：物理返回键 / 导航栏返回 / `uni.navigateBack`（通过全局 mixin 的 onBackPress 接入）
 * - H5 端：浏览器后退按钮 / 后退手势（通过 popstate 事件接入）
 * - iOS 侧滑返回手势控制（`app.setSideSlipGesture`）
 */
export class BackGuardManager {
	/** 返回守卫执行中标记：路由器发起返回时置位，避免递归 */
	private backGuardRunning = false

	/** H5 平台返回守卫：当前页面 URL，用于判断 popstate 是否为后退 */
	private h5BackUrl = ''

	constructor(private deps: BackGuardDeps) {}

	/**
	 * 设置 H5 平台当前页面 URL（install 时初始化）
	 *
	 * 作为 popstate 后退判断的基准：URL 变化说明发生了后退。
	 *
	 * @param url - 当前页面 URL
	 */
	setH5BackUrl(url: string): void {
		this.h5BackUrl = url
	}

	/**
	 * 标记路由器发起的返回
	 *
	 * 供 `router.back()` 在执行 `uni.navigateBack` 前置位，避免再次触发返回守卫。
	 *
	 * @param running - 是否处于路由器发起的返回中
	 */
	setRouterBackRunning(running: boolean): void {
		this.backGuardRunning = running
	}

	/**
	 * 处理页面 onBackPress 生命周期（由全局 mixin 注入到每个页面）
	 *
	 * 覆盖 App 端物理返回键、顶部导航栏返回按钮、外部 `uni.navigateBack` 调用。
	 * 返回 `true` 阻止默认返回并异步执行返回守卫链；返回 `false` / `undefined` 放行默认返回。
	 *
	 * **递归保护**：路由器发起的返回（`router.back()` 或守卫放行后的手动返回）会再次触发
	 * `onBackPress`，通过 `backGuardRunning` 标记放行，避免守卫重复执行与死循环。
	 *
	 * **平台限制**：仅 App 平台接入。iOS 侧滑返回不触发 `onBackPress`，
	 * 需配合 `app.setSideSlipGesture` 禁用手势后由本方法接管；
	 * H5 浏览器后退由 popstate 事件接入（见 {@link handleH5PopState}），
	 * 小程序返回不支持拦截。
	 *
	 * @returns 返回 true 阻止默认返回，返回 false / undefined 放行
	 */
	handleBackPress(): boolean | undefined {
		// 仅 App 平台拦截；H5 / 小程序保持默认返回行为
		if (!getPlatform().isApp) return undefined

		// 路由器发起的返回（守卫已通过）→ 放行，避免递归
		if (this.backGuardRunning) return false

		// 根页面（无上级页面）→ 放行默认行为（如 Android 物理键退出应用）
		const pages = getCurrentPages()
		if (pages.length < 2) return false

		// 阻止默认返回，异步执行返回守卫链，放行后手动返回
		this.runBackGuardFromBackPress().catch(() => {
			// 守卫异常已由 onError 处理
		})
		return true
	}

	/**
	 * 由 onBackPress 触发的返回守卫流程（异步执行，App 端）
	 *
	 * 执行顺序：onBeforeBack → beforeEach → beforeResolve，全部放行后执行 `uni.navigateBack`。
	 * 由于 `onBackPress` 必须同步返回，本方法以 fire-and-forget 方式运行；
	 * 守卫放行后手动返回时会再次触发 `onBackPress`，由 `backGuardRunning` 放行。
	 */
	private async runBackGuardFromBackPress(): Promise<void> {
		const from = this.deps.getCurrentRoute()
		const pages = getCurrentPages()
		const targetPage = pages[pages.length - 2]
		if (!targetPage) return
		const to = this.deps.resolve(`/${targetPage.route}`)
		await this.runBackGuardChain(to, from, () => this.executeBack())
	}

	/**
	 * H5 平台返回守卫入口（由浏览器 popstate 事件触发）
	 *
	 * 覆盖浏览器后退按钮 / 后退手势。popstate 触发时浏览器已完成后退，
	 * 采用「撤销后退 → 执行返回守卫 → 守卫放行后重新后退」策略：
	 * 1. 记录当前页 URL（`h5BackUrl`），popstate 后 URL 已变化说明发生了后退；
	 * 2. `history.go(1)` 恢复当前页（触发二次 popstate，命中「回到当前页」分支放行）；
	 * 3. 同步捕获 to/from 执行返回守卫链（避免依赖 uni-app 处理 popstate 后的页面栈时序）；
	 * 4. 守卫放行后经 {@link executeBack} 重新后退（再次触发 popstate，由 `backGuardRunning` 放行）。
	 *
	 * 根页面（无上级页面）不拦截，保留浏览器默认行为（离开站点 / 回上一站点）。
	 */
	handleH5PopState(): void {
		// 路由器发起的返回（守卫已通过）→ 放行，并更新当前页 URL
		if (this.backGuardRunning) {
			this.h5BackUrl = location.href
			return
		}

		// 恢复当前页的二次 popstate / 前进回当前页 → 放行
		if (location.href === this.h5BackUrl) return

		// 根页面（无上级页面）→ 放行浏览器默认行为
		const pages = getCurrentPages()
		if (pages.length < 2) return

		// 撤销浏览器后退，恢复当前页
		history.go(1)

		// 同步捕获 to/from 后执行返回守卫链
		const from = this.deps.getCurrentRoute()
		const targetPage = pages[pages.length - 2]
		if (!targetPage) return
		const to = this.deps.resolve(`/${targetPage.route}`)
		this.runBackGuardChain(to, from, () => this.executeBack()).catch(() => {
			// 守卫异常已由 onError 处理
		})
	}

	/**
	 * 执行返回守卫链（onBeforeBack → beforeEach → beforeResolve）
	 *
	 * 全部放行后调用 onPass 执行真正的返回，随后同步路由状态并触发后置钩子。
	 * 任一守卫返回 false 时中止（NAVIGATION_ABORTED）；重定向 / 异常行为与完整导航一致。
	 *
	 * @param to - 返回目标路由（上一页）
	 * @param from - 当前正要离开的路由
	 * @param onPass - 守卫全部放行后执行返回的回调
	 */
	private async runBackGuardChain(to: RouteLocation, from: RouteLocation, onPass: () => Promise<void>): Promise<void> {
		// 返回守卫（onBeforeBack）
		const backPass = await this.deps.guardManager.runBeforeBackGuards(to, from)
		if (!backPass) {
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_ABORTED)
			this.deps.guardManager.runAfterGuards(to, from, failure)
			this.deps.onNavigationFailure(failure, to, from)
			return
		}

		// 前置守卫与解析守卫（复用完整导航的守卫结果处理，支持中止/重定向）
		const beforeResult = await this.deps.guardManager.runBeforeGuards(to, from)
		const handled = this.deps.handleGuardResult(beforeResult, to, from)
		if (handled) return

		const beforeResolveResult = await this.deps.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.deps.handleGuardResult(beforeResolveResult, to, from)
		if (handledResolve) return

		// 守卫通过，执行返回
		await onPass()
		this.deps.syncCurrentRoute()
		this.deps.guardManager.runAfterGuards(to, from)
	}

	/**
	 * 守卫放行后执行真正的返回（uni.navigateBack）
	 *
	 * 置位 `backGuardRunning`：App 端再次触发 onBackPress、H5 端再次触发 popstate 时据此放行，
	 * 避免守卫重复执行与死循环。
	 */
	private async executeBack(): Promise<void> {
		this.backGuardRunning = true
		try {
			await goBack(1)
		} finally {
			this.backGuardRunning = false
		}
	}

	/**
	 * 按当前路由动态设置 iOS 侧滑返回手势（由全局 mixin 在页面 onShow 时调用）
	 *
	 * 通过 `app.setSideSlipGesture` 回调决定当前页面的 popGesture：
	 * - `'none'`：禁用侧滑返回，使侧滑返回无法绕过守卫（配合 onBackPress 拦截）
	 * - `'close'`：开启原生侧滑返回，保留原生手势体验（侧滑不经过守卫）
	 *
	 * 仅 iOS 平台生效；未配置 `app.setSideSlipGesture` 时不干预手势。
	 */
	applySideSlipGesture(): void {
		const config = this.deps.options?.app?.setSideSlipGesture
		// 仅 iOS 平台存在侧滑返回手势；Android 使用物理返回键，由 onBackPress 拦截
		if (typeof config !== 'function' || !getPlatform().isIOS) return
		const value = config(this.deps.getCurrentRoute())
		if (value === 'none' || value === 'close') {
			plus.webview.currentWebview()?.setStyle({ popGesture: value })
		}
	}
}
