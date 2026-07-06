/**
 * 路径处理工具函数
 *
 * @description 提供跨平台路径规范化、扩展名过滤、路径排除匹配等通用功能，
 * 供多个插件复用，避免重复实现。
 */
/**
 * 将路径中的反斜杠转换为正斜杠，确保跨平台一致性
 *
 * @param {string} filePath - 待规范化的文件路径
 * @returns {string} 使用正斜杠的路径字符串
 *
 * @description Windows 系统下路径使用反斜杠 `\`，而 Unix 系统使用正斜杠 `/`。
 * 统一转换为正斜杠可避免跨平台路径比较失败。
 *
 * @example
 * ```typescript
 * normalizePath('assets\\index-abc123.js')
 * // 'assets/index-abc123.js'
 *
 * normalizePath('assets/index.js')
 * // 'assets/index.js'
 * ```
 */
declare function normalizePath(filePath: string): string;
/**
 * 检查文件扩展名是否通过包含/排除过滤条件
 *
 * @param {string} ext - 文件扩展名（小写，含点号，如 `.js`）
 * @param {object} options - 过滤选项
 * @param {string[]} [options.includeExtensions] - 包含的扩展名列表（为空则包含所有）
 * @param {string[]} [options.excludeExtensions] - 排除的扩展名列表
 * @returns {boolean} 扩展名是否通过过滤（`true` 表示应包含该文件）
 *
 * @description 按以下优先级判断：
 * 1. 如果 `excludeExtensions` 非空且扩展名在其中，返回 `false`
 * 2. 如果 `includeExtensions` 非空且扩展名不在其中，返回 `false`
 * 3. 其余情况返回 `true`
 *
 * @example
 * ```typescript
 * isExtensionIncluded('.js', { includeExtensions: ['.js', '.css'], excludeExtensions: [] })
 * // true
 *
 * isExtensionIncluded('.map', { includeExtensions: [], excludeExtensions: ['.map'] })
 * // false
 *
 * isExtensionIncluded('.js', { includeExtensions: [], excludeExtensions: [] })
 * // true（两个列表均为空，包含所有）
 * ```
 */
declare function isExtensionIncluded(ext: string, options: {
    includeExtensions?: string[];
    excludeExtensions?: string[];
}): boolean;
/**
 * 检查文件路径是否匹配排除路径列表
 *
 * @param {string} relativePath - 文件的相对路径（应先使用 {@link normalizePath} 规范化）
 * @param {string[]} excludePaths - 排除路径列表
 * @param {object} [options] - 匹配选项
 * @param {'simple' | 'segment'} [options.matchMode='simple'] - 匹配模式：
 *   - `'simple'`：简单的 startsWith / includes 匹配
 *   - `'segment'`：基于路径段边界的精确匹配，避免子字符串误匹配
 * @returns {boolean} 路径是否应被排除（`true` 表示应排除）
 *
 * @description 根据匹配模式检查路径是否命中排除列表：
 * - **simple 模式**：路径以排除项开头或包含排除项即命中
 * - **segment 模式**：基于路径段边界匹配，确保 `excludePaths: ['test']` 不会误排除 `testdata/`
 *
 * 路径比较前会自动调用 {@link normalizePath} 统一分隔符。
 *
 * @example
 * ```typescript
 * isPathExcluded('assets/test/file.js', ['test'])
 * // true（simple 模式，默认）
 *
 * isPathExcluded('testdata/file.js', ['test'], { matchMode: 'segment' })
 * // false（segment 模式，'testdata' 不等于路径段 'test'）
 *
 * isPathExcluded('assets/test/file.js', ['test'], { matchMode: 'segment' })
 * // true（'test' 匹配路径段）
 * ```
 */
declare function isPathExcluded(relativePath: string, excludePaths: string[], options?: {
    matchMode?: 'simple' | 'segment';
}): boolean;
/**
 * 检查扩展名是否为已压缩格式
 *
 * @param {string} ext - 文件扩展名（小写，含点号）
 * @returns {boolean} 是否为已压缩格式（`.gz` 或 `.br`）
 *
 * @example
 * ```typescript
 * isPreCompressed('.gz')   // true
 * isPreCompressed('.br')   // true
 * isPreCompressed('.js')   // false
 * ```
 */
declare function isPreCompressed(ext: string): boolean;

export { isExtensionIncluded, isPathExcluded, isPreCompressed, normalizePath };
