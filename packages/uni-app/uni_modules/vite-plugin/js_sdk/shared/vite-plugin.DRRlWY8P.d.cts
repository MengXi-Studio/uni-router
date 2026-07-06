/**
 * 参数验证器，提供流畅的 API 用于验证插件配置
 *
 * @class Validator
 * @description 该类提供了流畅的 API 用于验证插件配置，支持必填字段、类型验证、自定义验证规则等
 * @example
 * ```typescript
 * const validator = new Validator(options)
 * validator
 *   .field('sourceDir').required().string()
 *   .field('targetDir').required().string()
 *   .field('overwrite').boolean().default(true)
 *   .validate()
 * ```
 */
declare class Validator<T extends Record<string, any>, K extends keyof T = any> {
    /**
     * 要验证的选项对象
     */
    private options;
    /**
     * 当前正在验证的字段名
     */
    private currentField;
    /**
     * 验证错误信息
     */
    private errors;
    /**
     * 构造函数
     * @param options 要验证的选项对象
     */
    constructor(options: T);
    /**
     * 指定要验证的字段
     * @param field 字段名
     * @returns Validator 实例，用于链式调用
     */
    field<NextK extends keyof T>(field: NextK): Validator<T, NextK>;
    /**
     * 标记字段为必填
     * @returns Validator 实例，用于链式调用
     */
    required(): this;
    /**
     * 验证字段值是否为字符串类型
     * @returns Validator 实例，用于链式调用
     */
    string(): this;
    /**
     * 验证字段值是否为布尔类型
     * @returns Validator 实例，用于链式调用
     */
    boolean(): this;
    /**
     * 验证字段值是否为数字类型
     * @returns Validator 实例，用于链式调用
     */
    number(): this;
    /**
     * 验证字段值是否为数组类型
     * @returns Validator 实例，用于链式调用
     */
    array(): this;
    /**
     * 验证字段值是否为对象类型
     * @returns Validator 实例，用于链式调用
     */
    object(): this;
    /**
     * 为字段设置默认值（仅当字段值为 undefined 或 null 时生效）
     * @param defaultValue 默认值
     * @returns Validator 实例，用于链式调用
     */
    default(defaultValue: T[K]): this;
    /**
     * 验证字段值是否在允许的枚举列表中
     *
     * @param allowedValues 允许的值列表
     * @returns Validator 实例，用于链式调用
     *
     * @description 当字段值存在（非 undefined 且非 null 且非空字符串）时，
     * 检查其是否在允许的枚举列表中。空值跳过验证。
     *
     * @example
     * ```typescript
     * validator
     *   .field('position').enum(['center', 'top', 'bottom'])
     *   .field('format').enum(['bar', 'spinner', 'minimal'])
     * ```
     */
    enum(allowedValues: string[]): this;
    /**
     * 验证数字字段值是否不小于指定最小值
     *
     * @param min 最小值（包含）
     * @returns Validator 实例，用于链式调用
     *
     * @description 当字段值存在（非 undefined 且非 null）时，
     * 检查其是否为数字类型且不小于最小值。通常与 `.number()` 链式调用配合使用。
     *
     * @example
     * ```typescript
     * validator
     *   .field('checkInterval').number().minValue(5000)
     *   .field('width').number().minValue(1)
     * ```
     */
    minValue(min: number): this;
    /**
     * 验证数字字段值是否不大于指定最大值
     *
     * @param max 最大值（包含）
     * @returns Validator 实例，用于链式调用
     *
     * @description 当字段值存在（非 undefined 且非 null）时，
     * 检查其是否为数字类型且不大于最大值。通常与 `.number()` 链式调用配合使用。
     *
     * @example
     * ```typescript
     * validator
     *   .field('hashLength').number().minValue(1).maxValue(32)
     * ```
     */
    maxValue(max: number): this;
    /**
     * 使用自定义函数验证字段值
     * @param validator 自定义验证函数，返回 true 表示验证通过，返回 false 表示验证失败
     * @param message 验证失败时的错误信息
     * @returns Validator 实例，用于链式调用
     */
    custom(validator: (value: T[K]) => boolean, message: string): this;
    /**
     * 执行验证，验证失败时抛出错误
     * @returns 验证后的选项对象
     * @throws {Error} 验证失败时抛出包含所有错误信息的异常
     */
    validate(): T;
}

export { Validator as V };
