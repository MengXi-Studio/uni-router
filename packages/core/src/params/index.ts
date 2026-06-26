import type { ParamObject } from '@/types/route'
import { warn } from '@/utils/general'

/** storage key 前缀 */
const PARAMS_STORAGE_PREFIX = '__uni_router_params__'

/** URL query 中传递 params key 的字段名 */
export const PARAMS_KEY = '__params_key'

/** 内置通信管理器注入到 params 的导航标识字段名 */
export const NAV_ID_KEY = '__navId'

/**
 * 生成短随机 ID
 *
 * 格式：pk_ + 6位十六进制随机数（如 pk_a3f8d2）
 * 碰撞概率：16^6 ≈ 1677万分之一，足够用于单次导航
 */
function generateKey(): string {
	const hex = Math.floor(Math.random() * 0xffffff)
		.toString(16)
		.padStart(6, '0')
	return `pk_${hex}`
}

/**
 * 安全获取当前页面栈
 */
function safeGetCurrentPages(): UniPage[] {
	if (typeof getCurrentPages !== 'function') return []
	return getCurrentPages()
}

/**
 * 检查指定 params key 对应的页面是否仍在页面栈中
 *
 * 通过遍历页面栈，检查每个页面的 URL 中是否包含 __params_key=<key>
 */
function isPageInStack(key: string): boolean {
	const pages = safeGetCurrentPages()
	const encodedKey = encodeURIComponent(key)
	return pages.some(page => {
		const fullPath: string = page.$page?.fullPath ?? ''
		return fullPath.includes(`${PARAMS_KEY}=${encodedKey}`)
	})
}

/**
 * Params 存储管理器接口
 */
export interface ParamsManager {
	/** 存储 params，返回生成的 key */
	set(params: ParamObject, persistent?: boolean): string
	/** 根据 key 读取 params（惰性清理：页面已不在栈中则返回 undefined 并删除） */
	get(key: string): ParamObject | undefined
	/** 根据 key 读取 params（不做惰性清理，用于导航解析阶段目标页面尚未入栈的场景） */
	peek(key: string): ParamObject | undefined
	/** 删除指定 key 的 params */
	remove(key: string): void
	/** 清理所有无效 params（页面已不在栈中的） */
	cleanupStale(): void
	/** 清理所有 params（路由器初始化时调用） */
	cleanupAll(): void
}

/**
 * 创建 Params 存储管理器
 *
 * 管理页面参数的存储、读取和清理。
 * 支持内存 Map 和 uni.setStorageSync 两种存储方式。
 *
 * @param defaultPersistent - 全局默认是否持久化
 * @returns ParamsManager 实例
 */
export function createParamsManager(defaultPersistent: boolean): ParamsManager {
	/** 内存存储 */
	const memoryMap = new Map<string, ParamObject>()

	function set(params: ParamObject, persistent?: boolean): string {
		// 含 __navId 的 params 强制持久化（解决 H5 刷新丢失 navId 导致 usePageChannel 失效问题）
		const forcePersistent = NAV_ID_KEY in params
		const useStorage = forcePersistent || (persistent ?? defaultPersistent)
		const key = generateKey()

		// 校验可序列化性
		try {
			JSON.stringify(params)
		} catch {
			warn('params must be JSON-serializable. Non-serializable values will be lost.')
		}

		if (useStorage) {
			try {
				uni.setStorageSync(PARAMS_STORAGE_PREFIX + key, JSON.stringify(params))
			} catch {
				// storage 写入失败时降级为内存存储
				warn('Failed to write params to storage, falling back to memory storage.')
				memoryMap.set(key, params)
			}
		} else {
			memoryMap.set(key, params)
		}

		return key
	}

	function get(key: string): ParamObject | undefined {
		// 先从内存读
		if (memoryMap.has(key)) {
			// 惰性清理：检查页面是否还在栈中
			if (!isPageInStack(key)) {
				memoryMap.delete(key)
				return undefined
			}
			return memoryMap.get(key)
		}

		// 再从 storage 读
		try {
			const raw = uni.getStorageSync(PARAMS_STORAGE_PREFIX + key)
			if (raw) {
				// 惰性清理
				if (!isPageInStack(key)) {
					uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key)
					return undefined
				}
				try {
					return JSON.parse(raw) as ParamObject
				} catch {
					uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key)
					return undefined
				}
			}
		} catch {
			// storage 读取失败，忽略
		}

		return undefined
	}

	function peek(key: string): ParamObject | undefined {
		// 先从内存读（不做惰性清理）
		if (memoryMap.has(key)) {
			return memoryMap.get(key)
		}

		// 再从 storage 读（不做惰性清理）
		try {
			const raw = uni.getStorageSync(PARAMS_STORAGE_PREFIX + key)
			if (raw) {
				try {
					return JSON.parse(raw) as ParamObject
				} catch {
					return undefined
				}
			}
		} catch {
			// storage 读取失败，忽略
		}

		return undefined
	}

	function remove(key: string): void {
		memoryMap.delete(key)
		try {
			uni.removeStorageSync(PARAMS_STORAGE_PREFIX + key)
		} catch {
			// ignore
		}
	}

	function cleanupStale(): void {
		// 清理内存中已不在页面栈的 params
		for (const key of memoryMap.keys()) {
			if (!isPageInStack(key)) {
				memoryMap.delete(key)
			}
		}

		// 清理 storage 中已不在页面栈的 params
		try {
			const info = uni.getStorageInfoSync()
			for (const k of info.keys) {
				if (k.startsWith(PARAMS_STORAGE_PREFIX)) {
					const paramsKey = k.slice(PARAMS_STORAGE_PREFIX.length)
					if (!isPageInStack(paramsKey)) {
						uni.removeStorageSync(k)
					}
				}
			}
		} catch {
			// storage API 不可用时忽略
		}
	}

	function cleanupAll(): void {
		memoryMap.clear()
		try {
			const info = uni.getStorageInfoSync()
			for (const k of info.keys) {
				if (k.startsWith(PARAMS_STORAGE_PREFIX)) {
					uni.removeStorageSync(k)
				}
			}
		} catch {
			// storage API 不可用时忽略
		}
	}

	return { set, get, peek, remove, cleanupStale, cleanupAll }
}
