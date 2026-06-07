/// <reference types="vite/client" />

interface VersionInfo {
	version: string
	buildTime: string
	timestamp: number
	format: string
	[key: string]: unknown
}

declare const __APP_VERSION__: string
declare const __APP_VERSION___INFO: VersionInfo

interface Window {
	__LOADING_MANAGER__?: import('./uni_modules/mxuni-router/js_sdk/plugins/loadingManager/index.js').LoadingManager
	__VUC_REFRESH__?: () => void
	__VUC_DISMISS__?: () => void
}
