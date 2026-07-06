/**
 * 带并发限制的批量执行
 *
 * @template T - 输入项类型
 * @template R - 返回结果类型
 * @param {T[]} items - 待处理项列表
 * @param {(item: T) => Promise<R>} handler - 处理函数
 * @param {number} concurrency - 最大并发数
 * @returns {Promise<R[]>} 处理结果数组，顺序与输入项对应
 *
 * @description 使用工作池模式并发执行异步任务，结果顺序与输入项对应。
 * 当并发数大于等于项数时，所有项同时执行；否则按并发数分批执行。
 *
 * @example
 * ```typescript
 * const results = await runWithConcurrency(
 *   [1, 2, 3, 4, 5],
 *   async (n) => { await delay(100); return n * 2 },
 *   2
 * )
 * // [2, 4, 6, 8, 10]
 * ```
 */
declare function runWithConcurrency<T, R>(items: T[], handler: (item: T) => Promise<R>, concurrency: number): Promise<R[]>;

export { runWithConcurrency };
