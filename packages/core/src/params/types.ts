import type { ParamObject } from '@/types'

/**
 * Params 内存存储映射
 *
 * params key -> params 对象，用于非持久化场景的内存存储
 */
export type ParamsMemoryMap = Map<string, ParamObject>
