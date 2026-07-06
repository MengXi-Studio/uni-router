/**
 * 复制操作的选项接口
 */
interface CopyOptions {
    /**
     * 是否支持递归复制
     */
    recursive: boolean;
    /**
     * 是否覆盖同名文件
     */
    overwrite: boolean;
    /**
     * 是否启用增量复制
     */
    incremental?: boolean;
    /**
     * 并行处理的最大文件数
     */
    parallelLimit?: number;
    /**
     * 是否跳过空目录
     */
    skipEmptyDirs?: boolean;
}
/**
 * 复制结果接口
 */
interface CopyResult {
    /**
     * 复制的文件数量
     */
    copiedFiles: number;
    /**
     * 跳过的文件数量
     */
    skippedFiles: number;
    /**
     * 复制的目录数量
     */
    copiedDirs: number;
    /**
     * 总执行时间（毫秒）
     */
    executionTime: number;
}

/**
 * 检查源文件是否存在
 * @param sourcePath 源文件路径
 * @throws 当源文件不存在或无法访问时抛出异常
 */
declare function checkSourceExists(sourcePath: string): Promise<void>;
/**
 * 执行文件复制操作（优化版：并行IO）
 * @param sourcePath 源文件或目录路径
 * @param targetPath 目标文件或目录路径
 * @param options 复制选项
 * @returns 复制结果
 * @throws 当复制过程中出现错误时抛出异常
 */
declare function copySourceToTarget(sourcePath: string, targetPath: string, options: CopyOptions): Promise<CopyResult>;
/**
 * 写入文件内容
 * @param filePath 文件路径
 * @param content 文件内容
 * @throws 当写入过程中出现错误时抛出异常
 */
declare function writeFileContent(filePath: string, content: string): Promise<void>;
/**
 * 扫描目录中的文件信息
 */
interface ScannedFile {
    /** 文件绝对路径 */
    filePath: string;
    /** 文件大小（字节） */
    size: number;
    /** 文件扩展名（小写，含点号，如 '.js'） */
    extension: string;
}
/**
 * 目录扫描选项
 */
interface ScanDirectoryOptions {
    /** 包含的文件扩展名列表，为空则包含所有 */
    includeExtensions?: string[];
    /** 排除的路径模式列表 */
    excludePatterns?: string[];
    /** 自定义文件过滤函数，返回 true 表示包含该文件 */
    filter?: (filePath: string, extension: string, size: number) => boolean;
}
/**
 * 递归扫描目录，收集所有文件信息
 *
 * @async
 * @param {string} dirPath - 要扫描的目录路径
 * @param {ScanDirectoryOptions} options - 扫描选项
 * @returns {Promise<ScannedFile[]>} 文件信息列表
 *
 * @description 递归遍历指定目录下的所有文件，收集每个文件的大小和扩展名信息，
 * 支持按扩展名、路径模式和自定义过滤函数进行过滤。
 *
 * @example
 * ```typescript
 * const jsFiles = await scanDirectory('dist', { includeExtensions: ['.js'] })
 * const files = await scanDirectory('dist', { excludePatterns: ['node_modules'] })
 * ```
 */
declare function scanDirectory(dirPath: string, options?: ScanDirectoryOptions): Promise<ScannedFile[]>;
/**
 * 将数据写入 JSON 文件
 *
 * @async
 * @param {string} filePath - 输出文件路径
 * @param {object} data - 要序列化的数据对象
 * @param {number} [indent=2] - JSON 缩进空格数
 * @returns {Promise<void>}
 *
 * @description 将任意数据对象序列化为 JSON 格式并写入文件。
 * 内部使用 writeFileContent 确保统一的错误处理。
 *
 * @example
 * ```typescript
 * await writeJsonReport('dist/report.json', { timestamp: Date.now(), stats: [] })
 * ```
 */
declare function writeJsonReport(filePath: string, data: object, indent?: number): Promise<void>;
/**
 * 同步写入文件内容，自动创建不存在的目录
 *
 * @param filePath 文件路径
 * @param content 文件内容
 *
 * @description 同步写入文件，如果目标目录不存在会自动递归创建。
 * 适用于构建钩子中需要同步写入的场景（如 `transform` 钩子）。
 *
 * @throws 当文件写入失败时（如权限不足），抛出 `NodeJS.ErrnoException`
 *
 * @example
 * ```typescript
 * writeFileSyncSafely('/project/src/auto-imports.d.ts', 'declare global { ... }')
 * ```
 */
declare function writeFileSyncSafely(filePath: string, content: string): void;
/**
 * 检查文件内容是否需要更新（同步版本）
 *
 * @param filePath 文件路径
 * @param newContent 新生成的文件内容
 * @returns 如果需要更新返回 `true`，否则返回 `false`
 *
 * @description 对比现有文件内容与新生成的内容，
 * 仅在内容发生变化时才需要写入，减少不必要的文件 IO 操作。
 *
 * @example
 * ```typescript
 * if (shouldUpdateFileContent('/project/src/auto-imports.d.ts', newContent)) {
 *   writeFileSyncSafely('/project/src/auto-imports.d.ts', newContent)
 * }
 * ```
 */
declare function shouldUpdateFileContent(filePath: string, newContent: string): boolean;
/**
 * 解析报告输出路径
 *
 * @param {string} outDir - 构建输出目录路径
 * @param {string | false} reportPath - 报告文件路径，为 false 时返回 null
 * @returns {string | null} 解析后的绝对路径，reportPath 为 false 时返回 null
 *
 * @description 当 reportPath 为相对路径时，相对于 outDir 解析；
 * 为绝对路径时直接使用；为 false 时返回 null。
 *
 * @example
 * ```typescript
 * resolveReportPath('dist', 'report.json')   // 'dist/report.json'
 * resolveReportPath('dist', '/tmp/r.json')    // '/tmp/r.json'
 * resolveReportPath('dist', false)            // null
 * ```
 */
declare function resolveReportPath(outDir: string, reportPath: string | false): string | null;
/**
 * 扫描目录并将文件信息映射为自定义结构
 *
 * @async
 * @template T - 映射后的条目类型
 * @param {string} dirPath - 要扫描的目录路径
 * @param {object} params - 扫描与映射参数
 * @param {ScanDirectoryOptions} [params.scanOptions] - 传递给 scanDirectory 的选项
 * @param {(file: ScannedFile, dirPath: string) => T} params.mapFn - 将 ScannedFile 映射为自定义结构的函数
 * @returns {Promise<T[]>} 映射后的条目列表
 *
 * @description 递归扫描目录并对每个文件应用 mapFn 转换，
 * 是多个插件中"扫描 + 过滤 + 映射"模式的通用封装。
 * mapFn 接收原始 ScannedFile 和 dirPath，可自由计算 relativePath 等字段。
 *
 * @example
 * ```typescript
 * const candidates = await scanAndMapFiles('dist', {
 *   scanOptions: { filter: (fp, ext, size) => size > 1024 },
 *   mapFn: (f, dir) => ({
 *     filePath: f.filePath,
 *     relativePath: normalizePath(path.relative(dir, f.filePath)),
 *     size: f.size,
 *     ext: f.extension
 *   })
 * })
 * ```
 */
declare function scanAndMapFiles<T>(dirPath: string, params: {
    scanOptions?: ScanDirectoryOptions;
    mapFn: (file: ScannedFile, dirPath: string) => T;
}): Promise<T[]>;
/**
 * 批量删除文件列表中的文件
 *
 * @async
 * @param {string[]} filePaths - 要删除的文件绝对路径列表（会自动去重）
 * @returns {Promise<void>}
 *
 * @description 根据文件路径列表删除文件，自动去重后逐个删除。
 * 删除失败时静默忽略错误（如文件已被删除或权限不足）。
 *
 * @example
 * ```typescript
 * await deleteFiles(['/dist/app.js', '/dist/app.js.gz'])
 * ```
 */
declare function deleteFiles(filePaths: string[]): Promise<void>;

export { checkSourceExists, copySourceToTarget, deleteFiles, resolveReportPath, scanAndMapFiles, scanDirectory, shouldUpdateFileContent, writeFileContent, writeFileSyncSafely, writeJsonReport };
export type { CopyOptions, CopyResult, ScanDirectoryOptions, ScannedFile };
