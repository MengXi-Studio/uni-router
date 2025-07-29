/**
 * 抛出一个带有项目名称前缀的错误
 * 该函数会创建一个新的 Error 对象，其错误信息会包含项目名称，用于在出现错误时明确标识错误来源
 *
 * @param message - 具体的错误信息，将显示在项目名称前缀之后
 * @throws {Error} 抛出一个包含项目名称和具体错误信息的 Error 对象
 */
export function error(message: string) {
	throw new Error(`[uni-router error]:${message}`)
}
