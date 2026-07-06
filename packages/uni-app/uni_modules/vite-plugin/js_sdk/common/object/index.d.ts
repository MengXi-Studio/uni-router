/**
 * 深度合并对象
 *
 * @typeParam T - 目标对象类型，必须为记录类型
 * @param sources - 待合并的源对象列表（按从左到右的顺序合并，右侧优先级更高）
 * @returns 合并后的完整对象
 *
 * @description 将多个源对象递归合并为一个新对象。合并规则：
 * - 当源值和目标值均为普通对象时，递归合并
 * - 否则，源值直接覆盖目标值
 * - `undefined` 值会被跳过，不会覆盖已有属性
 * - 不会修改任何输入的源对象
 *
 * @example
 * ```typescript
 * deepMerge(
 *   { a: 1, b: { c: 2 } },
 *   { b: { d: 3 }, e: 4 }
 * )
 * // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 *
 * deepMerge(
 *   { a: { x: 1 } },
 *   { a: null }
 * )
 * // { a: null }  // 非对象值直接覆盖
 * ```
 */
declare function deepMerge<T extends Record<string, any>>(...sources: Partial<T>[]): T;

export { deepMerge };
