export { V as Validator } from '../../shared/vite-plugin.DRRlWY8P.cjs';

/**
 * 验证全局变量名的合法性
 */
declare function validateGlobalName(name: string | undefined, fieldName: string): void;
/**
 * 验证模板字符串不包含 script 标签（XSS 防护）
 */
declare function validateNoScriptInTemplate(template: string | undefined, fieldName: string): void;
/**
 * 验证回调字段不包含 script 标签
 */
declare function validateCallbackFields(callbacks: Record<string, any>, fields: string[], objectName: string): void;

export { validateCallbackFields, validateGlobalName, validateNoScriptInTemplate };
