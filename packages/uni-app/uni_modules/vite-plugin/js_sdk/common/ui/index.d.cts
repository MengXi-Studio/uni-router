/**
 * ANSI 转义码匹配正则
 *
 * @description 匹配所有 SGR（Select Graphic Rendition）序列，
 * 用于从字符串中移除 ANSI 颜色和样式转义码。
 */
declare const ANSI_REGEX: RegExp;
/**
 * 移除字符串中的所有 ANSI 转义码
 *
 * @param str - 包含 ANSI 转义码的字符串
 * @returns 移除所有 ANSI 转义码后的纯文本字符串
 *
 * @example
 * ```typescript
 * stripAnsi('\x1b[32mgreen text\x1b[39m')  // 'green text'
 * ```
 */
declare function stripAnsi(str: string): string;
/**
 * ANSI 转义码工具集
 */
declare const ANSI: {
    /** 将光标重置到行首 */
    reset: string;
    /** 清除当前行内容 */
    clearLine: string;
    /** 隐藏终端光标 */
    hideCursor: string;
    /** 显示终端光标 */
    showCursor: string;
    green: (t: string) => string;
    cyan: (t: string) => string;
    gray: (t: string) => string;
    bold: (t: string) => string;
    red: (t: string) => string;
    yellow: (t: string) => string;
    magenta: (t: string) => string;
};

export { ANSI, ANSI_REGEX, stripAnsi };
