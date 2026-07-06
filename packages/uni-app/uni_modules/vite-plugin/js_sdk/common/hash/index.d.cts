/**
 * 生成随机哈希字符串
 *
 * @param length - 哈希字符串长度，默认 8，范围 1-64
 * @returns 随机十六进制哈希字符串
 *
 * @description 使用 `crypto.randomBytes` 生成密码学安全的随机字节，
 * 转换为十六进制字符串后截取到指定长度。
 * 长度超出 64 会被截断，小于 1 会被修正为 1。
 *
 * @example
 * ```typescript
 * generateRandomHash()      // 'a3f2b9c1'
 * generateRandomHash(16)    // 'a3f2b9c1d4e5f6a7'
 * ```
 */
declare function generateRandomHash(length?: number): string;

export { generateRandomHash };
