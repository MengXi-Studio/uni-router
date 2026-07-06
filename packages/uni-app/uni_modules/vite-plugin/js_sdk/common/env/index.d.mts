/**
 * 解析 .env 文件内容为键值对映射
 *
 * @param content - .env 文件的文本内容
 * @param options - 解析选项
 * @param options.prefix - 仅包含以此前缀开头的键（如 'VITE_'）
 * @returns 解析后的键值对映射
 *
 * @description 解析 .env 文件内容，支持以下特性：
 * - 跳过空行和以 `#` 开头的注释行
 * - 支持双引号和单引号包裹的值
 * - 可选按前缀过滤键名
 *
 * @example
 * ```typescript
 * const content = `
 * # Database config
 * DB_HOST=localhost
 * DB_PORT="5432"
 * VITE_API_URL='https://api.example.com'
 * `
 * const vars = parseEnvContent(content, { prefix: 'VITE_' })
 * // { VITE_API_URL: 'https://api.example.com' }
 * ```
 */
declare function parseEnvContent(content: string, options?: {
    prefix?: string;
}): Record<string, string>;

export { parseEnvContent };
