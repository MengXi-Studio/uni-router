/**
 * JavaScript/TypeScript 保留关键字和全局内置对象集合
 *
 * @description 这些标识符不应被自动导入，因为它们是语言内置关键字或全局对象，
 * 即使在映射表中存在同名条目也应跳过。
 */
declare const JS_KEYWORDS: Set<string>;
/**
 * 从源代码中移除注释和字符串字面量，避免误判标识符
 *
 * @param code - 源代码字符串
 * @returns 处理后的代码（注释和字符串内容被替换为空白字符，保留换行以维持行号对应）
 *
 * @description 支持移除以下内容：
 * - 单行注释 `//`
 * - 多行注释 `/* *\/`
 * - 单引号字符串 `'...'`
 * - 双引号字符串 `"..."`
 * - 模板字符串 `` `...` ``（保留 `${...}` 表达式内容）
 *
 * 注释和字符串内容被替换为等长的空白字符，保留换行符以维持行号对应关系。
 */
declare function stripCommentsAndStrings(code: string): string;

export { JS_KEYWORDS, stripCommentsAndStrings };
