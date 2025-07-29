# Installation

uni-router supports installation by importing HBuilderX through the command line and the plugin market.

## Package Manager

For an existing project that uses a JavaScript package manager, you can install uni-router from the npm registry:

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

Users developed with HBuilderX can install components in the uni-app plugin market in the form of uni_modules.

Click the "Download Plugin and Import HBuilderX" button in the upper right corner of the uni-app plugin market, and import it into the corresponding project.

Plugin Address: https://ext.dcloud.net.cn/plugin?id=24548

::: danger Attention

For projects created through HBuilderX, do not download uni-router via the command line, but rather through the plugin market.

:::

# Configuration

It is recommended to use easycom to simplify the introduction and registration of components.

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

If you are importing through the plugin market to [`HBuilderX`](https://ext.dcloud.net.cn/plugin?id=24548), you need to modify the component path.

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
