const toString = Object.prototype.toString

/**
 * 检查一个值是否为指定的类型
 *
 * @param val - 要检查类型的值
 * @param type - 期望的类型名称，例如 'Object'、'Array'、'String' 等
 */
export function is(val: unknown, type: string): boolean {
	return toString.call(val) === `[object ${type}]`
}

/**
 * 检查一个值是否为普通对象
 *
 * @param val - 要检查的值
 */
export function isObject(val: any): val is Record<any, any> {
	return val !== null && is(val, 'Object')
}

/**
 * 检查一个值是否为数组
 *
 * @param val - 要检查的值
 */
export function isArray(val: any): val is any[] {
	return val !== null && is(val, 'Array')
}

/**
 * 检查一个值是否为函数类型
 *
 * @param val - 要检查类型的值
 */
export function isFunction(val: unknown): val is Function {
	return typeof val === 'function'
}
