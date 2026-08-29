import type { ParamObject } from '@/types/route'

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
	/** 设置全局默认持久化策略 */
	setDefaultPersistent(persistent: boolean): void
}
