/**
 * 平台信息
 */
export interface PlatformInfo {
	/** 是否 App 平台（app / app-harmony） */
	isApp: boolean
	/** 是否 H5 平台 */
	isH5: boolean
	/** 是否小程序平台（mp-*） */
	isMp: boolean
	/** 是否 iOS 系统 */
	isIOS: boolean
	/** 是否 Android 系统 */
	isAndroid: boolean
	/** uni-app 平台类型：'app' | 'web' | 'mp-weixin' 等 */
	uniPlatform: string
	/** 系统名称：'ios' | 'android' 等 */
	osName: string
}

let cached: PlatformInfo | null = null

/**
 * 获取当前运行平台信息（基于 uni.getSystemInfoSync，带缓存）
 *
 * 统一的平台判断入口，替代分散的 `typeof window` / `typeof plus` 等特殊判断。
 * 首次调用时读取系统信息并缓存，之后直接返回。
 *
 * 兼容性：优先使用 `uniPlatform` / `osName`（HBuilderX 3.5.3+ 提供）；
 * 旧版本不返回 `uniPlatform` 时，回退到 `typeof plus` / `typeof window` 推断 App / H5。
 */
export function getPlatform(): PlatformInfo {
	if (cached) return cached

	let uniPlatform = ''
	let osName = ''
	try {
		const info = uni.getSystemInfoSync()
		uniPlatform = info.uniPlatform ?? ''
		osName = info.osName ?? info.platform ?? ''
	} catch {
		// getSystemInfoSync 异常时回退为空，按非 App / 非 H5 处理
	}

	// 兜底：旧版本 uni-app 可能不返回 uniPlatform，用环境对象推断平台类型
	const isApp = uniPlatform === 'app' || uniPlatform === 'app-harmony' || (uniPlatform === '' && typeof plus !== 'undefined')
	const isH5 = uniPlatform === 'web' || (uniPlatform === '' && typeof window !== 'undefined' && typeof document !== 'undefined')

	cached = {
		isApp,
		isH5,
		isMp: uniPlatform.startsWith('mp-'),
		isIOS: osName === 'ios',
		isAndroid: osName === 'android',
		uniPlatform,
		osName
	}
	return cached
}
