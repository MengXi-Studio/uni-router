/**
 * 页面参数值类型（JSON 可序列化数据）
 *
 * 与 vue-router 的 `RouteParamValue`（仅 `string`，因进 URL）不同：
 * mxuni-router 的 params 不进 URL，而是通过内存 / storage 传递，
 * 因此值类型支持原始类型 + 对象 + 数组，以满足页面间传递复杂数据的需求。
 *
 * 对象分支使用 `object` 而非递归 `ParamObject`，以兼容 `interface` 定义的对象类型
 * （它们没有索引签名，无法赋值给 `{ [key: string]: ... }`）。
 * `undefined` 分支用于兼容含可选属性的对象（`JSON.stringify` 会自动忽略 `undefined` 属性）。
 */
export type ParamValue = string | number | boolean | null | undefined | ParamValue[] | object

/**
 * 页面参数输入类型
 *
 * 用于 `router.push` / `router.replace` / `router.relaunch` 的 `params` 字段输入。
 *
 * 使用 `object` 而非 `Record<string, ParamValue>` 的原因：
 * TypeScript 严格模式下，`interface` 定义的对象类型没有显式索引签名，
 * 无法赋值给带索引签名的类型（包括 `Record<string, T>`），
 * 会导致 `const params: MyInterface = {...}; router.push({ params })` 类型报错。
 * 使用 `object` 可通过结构子类型兼容任意 `interface` 对象，运行时由 `ParamsManager` 校验 JSON 可序列化性。
 *
 * 注：vue-router 的 `RouteParamsRawGeneric` 采用 `Record<string, ...>` 是因为其值类型仅含原始类型
 * （`string | number | null | undefined`），原始类型属性的 `interface` 对象可通过结构子类型兼容 `Record`；
 * 而 mxuni-router 的 `ParamValue` 包含 `object` / `ParamValue[]` 分支（支持复杂数据传递），
 * 此场景下 `Record<string, ParamValue>` 在 vue-tsc 严格模式下仍不兼容 `interface` 对象，必须使用 `object`。
 */
export type ParamsInput = object

/**
 * 页面参数对象类型（读取侧）
 *
 * 用于 `route.params` 的读取类型，提供索引签名访问。
 * 输入侧（如 `router.push` 的 `params`）使用 `ParamsInput`（`object`）以兼容 `interface` 对象，
 * 内部通过 `as ParamObject` 断言后存储，目标页面读取时为 `Readonly<ParamObject>`。
 */
export type ParamObject = Record<string, ParamValue>
