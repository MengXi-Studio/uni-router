import type { RouteLocation } from '@/types'
import { RouterErrorCode } from '@/enums'
import { NavigationFailure } from '@/errors'
import { goBack } from '@/navigation'
import { getPlatform } from '@/utils'
import type { BackGuardDeps } from './type'

/**
 * 从 location.hash 提取规范化页面路径
 *
 * `'#/pages/test/test'` → `'/pages/test/test'`（移除 query）
 *
 * @param hash - location.hash 值
 * @returns 规范化后的页面路径
 */
function getHashPath(hash: string): string {
	return hash.replace(/^#\/?/, '/').split('?')[0]
}

/**
 * 从当前地址解析页面路径
 *
 * hash 模式（默认）：`'#/pages/test/test?x=1'` → `'/pages/test/test'`
 * history 模式：`'/pages/test/test?x=1'` → `'/pages/test/test'`
 *
 * @returns 移除 query 后的页面路径，根路径为 `'/'`
 */
function getH5LocationPath(): string {
	const { hash, pathname } = location
	if (hash && hash.startsWith('#/')) return getHashPath(hash)
	return pathname.split('?')[0] || '/'
}

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

	/** H5 平台：路由器发起的返回进行中（时间窗口内放行所有 popstate，防止死循环） */
	private h5ReturningBack = false

	/** H5 平台：路由器发起的返回目标路径（如 '/pages/test/test'），命中即视为返回完成 */
	private h5ReturnTarget: string | null = null

	/** H5 平台：返回进行中标志的自动复位定时器（兜底） */
	private h5Timer: ReturnType<typeof setTimeout> | null = null

	/** H5 平台：返回守卫执行中，避免并发 popstate 重复执行守卫链 */
	private h5GuardRunning = false

	constructor(private deps: BackGuardDeps) {}

	/**
	 * 同步 H5 平台当前页面 URL（install 时初始化，每次导航成功后更新）
	 *
	 * 作为 popstate 前进 / 无变化事件的判断基准。
	 */
	syncH5BackUrl(): void {
		if (!getPlatform().isH5) return
		this.h5BackUrl = location.href
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
	 * 标记一次 H5 返回开始（router.back() / executeBack 发起 navigateBack 前调用）
	 *
	 * 在时间窗口内将 {@link handleH5PopState} 对 popstate 的「撤销 + 返回守卫」处理抑制
	 * 为「放行并更新基准 URL」，避免 navigateBack 产生的（可能多次的）popstate 被误判为
	 * 外部后退而反复「撤销 + 重放」，形成相邻页面死循环闪烁。窗口结束自动复位。
	 * 仅 H5 平台需要；App 端由 onBackPress + `backGuardRunning` 处理。
	 */
	beginH5Back(targetPath?: string): void {
		if (!getPlatform().isH5) return
		this.h5ReturningBack = true
		this.h5ReturnTarget = targetPath ?? null
		if (this.h5Timer) clearTimeout(this.h5Timer)
		// 兜底复位：即使未到达目标页，时间窗口结束也自动清除标记，避免永久残留
		this.h5Timer = setTimeout(() => {
			this.h5ReturningBack = false
			this.h5ReturnTarget = null
			this.h5Timer = null
		}, 500)
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
		await this.runBackGuardChain(to, from, () => this.executeBack(to.path))
	}

	/**
	 * H5 平台返回守卫入口（由浏览器 popstate 事件触发）
	 *
	 * 覆盖浏览器后退按钮 / 后退手势。popstate 触发时浏览器**已完成后退**，因此直接
	 * 以 URL 确定后退目标并执行返回守卫链，不再「撤销后退 → 重放 navigateBack」：
	 * 1. 通过 {@link getH5LocationPath} 从当前地址解析后退目标（不依赖可能尚未更新的页面栈）；
	 * 2. 更新基准 URL（`h5BackUrl`），保证后续 popstate 判断基于最新地址；
	 * 3. 同步执行返回守卫链：守卫放行时无需任何额外操作（uni-app 自行完成切页，
	 *    页面 `onShow` 时全局 mixin 会 `syncRoute`）；守卫中止时用 `history.go(1)` 恢复原页面。
	 *
	 * 根页面（无上级页面）不拦截，保留浏览器默认行为（离开站点 / 回上一站点）。
	 */
	handleH5PopState(): void {
		// H5 返回进行中（时间窗口内）：此过程可能触发多次 popstate（navigateBack / 恢复原页面），
		// 一律放行并持续更新基准 URL；一旦命中返回目标页即视为本次返回完成（确定性），
		// 否则由时间窗口兜底复位。防止自身导航被误判为外部后退。
		if (this.h5ReturningBack) {
			this.h5BackUrl = location.href
			if (this.h5ReturnTarget && getHashPath(location.hash) === this.h5ReturnTarget) {
				this.h5ReturningBack = false
				this.h5ReturnTarget = null
				if (this.h5Timer) {
					clearTimeout(this.h5Timer)
					this.h5Timer = null
				}
			}
			return
		}

		// 路由器发起的返回（守卫已通过）→ 放行，并更新当前页 URL
		if (this.backGuardRunning) {
			this.h5BackUrl = location.href
			return
		}

		// 前进 / URL 未变化 → 放行
		if (location.href === this.h5BackUrl) return

		// 后退目标重复 popstate（守卫链执行中）→ 仅更新基准 URL，避免重复执行守卫
		if (this.h5GuardRunning) {
			this.h5BackUrl = location.href
			return
		}

		const from = this.deps.getCurrentRoute()
		const to = this.resolveH5BackTarget()

		// 浏览器已完成后退，先更新基准 URL
		this.h5BackUrl = location.href

		// 无法解析后退目标（外部页面 / 未配置的路径）或目标与当前路由一致 → 放行，交由 uni-app 处理
		if (!to || to.fullPath === from.fullPath) return

		this.h5GuardRunning = true
		this.runBackGuardChain(to, from, async () => {}, () => this.restoreH5Back(from.path))
			.catch(() => {
				// 守卫异常已由 onError 处理
			})
			.finally(() => {
				this.h5GuardRunning = false
			})
	}

	/**
	 * 解析 H5 浏览器后退目标
	 *
	 * 优先使用地址栏路径（后退已完成，URL 是最可靠的目标来源），根路径 `'/'`
	 * 无法直接 resolve（严格模式下会抛错），映射为页面栈首个页面的路径。
	 *
	 * @returns 后退目标路由；无法解析时返回 null（放行浏览器默认行为）
	 */
	private resolveH5BackTarget(): RouteLocation | null {
		const path = getH5LocationPath()
		const pages = getCurrentPages()
		// 根路径（首页地址可能为 '#/'）映射到页面栈首个页面
		const targetPath = path === '/' && pages[0] ? `/${pages[0].route}` : path
		try {
			return this.deps.resolve(targetPath)
		} catch {
			return null
		}
	}

	/**
	 * 恢复 H5 被中止的后退：前进回原页面
	 *
	 * 浏览器后退已被执行且守卫中止，通过 `history.go(1)` 前进回原页面；
	 * 置位 {@link beginH5Back} 标记，避免恢复产生的 popstate 被误判为新的外部后退。
	 *
	 * @param targetPath - 需要恢复的原页面路径
	 */
	private restoreH5Back(targetPath: string): void {
		this.beginH5Back(targetPath)
		history.go(1)
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
	 * @param onAbort - 守卫中止后的回滚回调（H5 浏览器后退已生效时用于恢复原页面）
	 */
	private async runBackGuardChain(to: RouteLocation, from: RouteLocation, onPass: () => Promise<void>, onAbort?: () => void): Promise<void> {
		// 返回守卫（onBeforeBack）
		const backPass = await this.deps.guardManager.runBeforeBackGuards(to, from)
		if (!backPass) {
			onAbort?.()
			const failure = new NavigationFailure(to, from, RouterErrorCode.NAVIGATION_ABORTED)
			this.deps.guardManager.runAfterGuards(to, from, failure)
			this.deps.onNavigationFailure(failure, to, from)
			return
		}

		// 前置守卫与解析守卫（复用完整导航的守卫结果处理，支持中止/重定向）
		const beforeResult = await this.deps.guardManager.runBeforeGuards(to, from)
		const handled = this.deps.handleGuardResult(beforeResult, to, from)
		if (handled) {
			if (beforeResult.type === 'abort') onAbort?.()
			return
		}

		const beforeResolveResult = await this.deps.guardManager.runBeforeResolveGuards(to, from)
		const handledResolve = this.deps.handleGuardResult(beforeResolveResult, to, from)
		if (handledResolve) {
			if (beforeResolveResult.type === 'abort') onAbort?.()
			return
		}

		// 守卫通过，执行返回
		await onPass()
		// H5 浏览器后退由 uni-app 自行切页，守卫执行时页面栈可能尚未更新；
		// 仅在页面栈已到达目标页时强制同步，避免把 currentRoute 回滚到来源页（目标页 onShow 会再同步）
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		if (!currentPage || `/${currentPage.route}` === to.path) {
			this.deps.syncCurrentRoute()
		}
		this.deps.guardManager.runAfterGuards(to, from)
	}

	/**
	 * 守卫放行后执行真正的返回（uni.navigateBack）
	 *
	 * 置位 `backGuardRunning`：App 端再次触发 onBackPress、H5 端再次触发 popstate 时据此放行，
	 * 避免守卫重复执行与死循环。
	 */
	private async executeBack(targetPath?: string): Promise<void> {
		this.backGuardRunning = true
		// H5：标记本次返回进行中，navigateBack 产生的 popstate 由 handleH5PopState 放行
		this.beginH5Back(targetPath)
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
