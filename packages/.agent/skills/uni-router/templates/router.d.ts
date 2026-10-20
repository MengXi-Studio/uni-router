// src/types/router.d.ts —— 手写扩展 RouteMeta
// 注意：若同时用 generateRouter({ dts: true }) 生成了 src/router.d.ts（RouteNameMap），
// 两者需合并到同一文件（或保持两个文件都 `import '@meng-xi/uni-router'`），避免重复声明冲突。
import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
	interface RouteMeta {
		roles?: string[]
		permissions?: string[]
		requireLeaveConfirm?: boolean
	}
}

// tsconfig.json 需确保 include 覆盖本文件：
// { "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
//   "compilerOptions": { "types": ["@dcloudio/types", "@meng-xi/uni-router"],
//                        "moduleResolution": "bundler" } }
