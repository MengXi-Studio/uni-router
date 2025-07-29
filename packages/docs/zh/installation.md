# 安装

uni-router 支持通过命令行以及插件市场导入 HBuilderX 的方式安装。

## 包管理器

对于一个现有的使用 JavaScript 包管理器的项目，你可以从 npm registry 中安装 uni-router：

::: code-group

```bash [npm]
npm install @meng-xi/uni-router
```

```bash [yarn]
yarn add @meng-xi/uni-router
```

```bash [pnpm]
pnpm add @meng-xi/uni-router
```

:::

## HBuilderX

使用 HBuilderX 开发的用户，可以在 uni-app 插件市场通过 js_sdk 的形式进行安装 js 库，通过 uni_modules 的形式进行安装组件。

在 uni-app 插件市场右上角点击 下载插件并导入 HBuilderX 按钮，导入到对应的项目中即可。

插件地址：<a href="https://ext.dcloud.net.cn/plugin?id=24548" target="_blank">https://ext.dcloud.net.cn/plugin?id=24548</a>

::: danger STOP

通过 HBuilderX 创建的项目，不要通过命令行方式下载 uni-router，而是应该通过插件市场下载。

:::

# 配置

建议使用 easycom 来简化组件的引入和注册

## NPM

```json
// pages.json
{
	"easycom": {
		"custom": {
			"^mx-(.*)": "@meng-xi/uni-router/components/$1/$1.vue"
		}
	}
}
```

## HBuilderX

如果你是通过插件市场导入到 [`HBuilderX`](https://ext.dcloud.net.cn/plugin?id=24548) 的，需要修改一下组件路径

```json
// pages.json
{
	"easycom": {
		"custom": {
			"^mx-(.*)": "@/uni_modules/mx-router/components/$1/$1.vue"
		}
	}
}
```

## 配置全局组件类型

在 vscode 中使用时，为了有组件的类型提示和自动填充，需要配置全局组件类型声明。

```json
// tsconfig.json
{
	"compilerOptions": {
		"types": ["@meng-xi/uni-router/components/index"]
	}
}
```

如果是使用 WebStorm，可能需要在 main.ts 文件中导入 index.d.ts 文件。

```typescript
// main.ts
import '@meng-xi/uni-router/components/index.d.ts'
```
