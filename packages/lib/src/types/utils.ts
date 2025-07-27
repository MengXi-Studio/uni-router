/**
 * 定义一个通用的可空类型。
 * 该类型表示一个值既可以是泛型类型 T 的实例，也可以是 null。
 * 常用于处理可能为 null 的值，避免类型错误。
 *
 * @typeParam T - 原始类型，可以是任意类型。
 */
export type Nullable<T> = T | null

/**
 * 定义一个通用的可记录类型。
 * 该类型表示一个对象，其键为字符串类型，值为泛型类型 T，默认值为 any。
 * 常用于需要表示任意键值对对象的场景。
 *
 * @typeParam T - 对象值的类型，默认为 any 类型。
 */
export type Recordable<T = any> = Record<string, T>
