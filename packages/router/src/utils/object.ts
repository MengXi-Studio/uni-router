import { unref } from 'vue'
import { isObject } from './is'
import { Recordable } from '@/types'

/**
 * 深度合并两个对象
 * 该函数会递归地将目标对象的属性合并到源对象中
 * 如果源对象和目标对象的对应属性都是对象，则会递归调用该函数进行深度合并；
 * 否则，直接用目标对象的属性值覆盖源对象的属性值
 *
 * @template T - 合并后对象的类型，默认为 any
 * @param src - 源对象，合并操作的基础对象，默认为空对象
 * @param target - 目标对象，其属性将被合并到源对象中，默认为空对象
 * @returns 合并后的对象，类型为 T
 */
export function deepMerge<T = any>(src: any = {}, target: any = {}): T {
	// 用于存储对象属性名的变量
	let key: string
	// 遍历目标对象的所有可枚举属性
	for (key in target) {
		// 如果源对象的当前属性值是一个对象，则递归调用 deepMerge 函数进行深度合并
		// 否则，直接将目标对象的当前属性值赋值给源对象的对应属性
		src[key] = isObject(src[key]) ? deepMerge(src[key], target[key]) : (src[key] = target[key])
	}
	// 返回合并后的源对象
	return src
}

/**
 * 获取动态属性
 * 该函数会遍历传入的属性对象，将每个属性值通过 `unref` 处理后存储到一个新对象中
 *
 * @template T - 传入属性对象的类型
 * @template U - 返回属性对象的完整类型，返回值为该类型的部分属性对象
 * @param props - 传入的属性对象
 * @returns 经过处理后的部分属性对象，类型为 U
 */
export function getDynamicProps<T, U>(props: T): U {
	// 初始化一个空对象，用于存储处理后的属性
	const ret: Recordable = {}

	// 遍历传入属性对象的所有可枚举属性
	Object.keys(props as object).map(key => {
		// 通过 unref 处理属性值，并将结果存储到 ret 对象中对应的属性上
		ret[key] = unref((props as Recordable)[key])
	})

	// 返回处理后的部分属性对象
	return ret as U
}
