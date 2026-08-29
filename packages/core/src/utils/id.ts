/**
 * 生成带前缀的短随机 ID
 *
 * 基于 Math.random 的 6 位十六进制，碰撞概率 16^6 ≈ 1677 万分之一。
 * 适合对长度敏感的场景（如 URL query / storage key），例如 params 存储 key。
 *
 * @param prefix - ID 前缀，如 `'pk_'`
 * @returns 形如 `${prefix}a3f8d2` 的短随机 ID
 */
export function generateRandomId(prefix: string): string {
	const hex = Math.floor(Math.random() * 0xffffff)
		.toString(16)
		.padStart(6, '0')
	return `${prefix}${hex}`
}

/**
 * 会话内自增序号（配合时间戳生成唯一 ID）
 */
let seq = 0

/**
 * 生成带前缀的唯一自增 ID
 *
 * 基于时间戳 + 自增序号，单调递增、会话内不会重复。
 * 适合需要强唯一性的场景，例如导航事件通道隔离（navId）。
 *
 * @param prefix - ID 前缀，如 `'nav-'`
 * @returns 形如 `${prefix}1715...-1` 的唯一 ID
 */
export function generateUniqueId(prefix: string): string {
	return `${prefix}${Date.now()}-${++seq}`
}
