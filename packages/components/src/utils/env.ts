/**
 * 检查当前环境是否为生产环境
 * 该函数通过读取 `import.meta.env.PROD` 的值来判断，若为 `true` 则表示当前是生产环境
 *
 * @returns 一个布尔值，`true` 表示当前是生产环境，`false` 表示非生产环境
 */
export function isProdMode(): boolean {
	return import.meta.env.PROD
}
