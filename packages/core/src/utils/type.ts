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
