# Installation

uni-router supports installation by importing HBuilderX through the command line and the plugin market.

## Package managers

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

Plugin address：<a href="https://ext.dcloud.net.cn/plugin?id=24548" target="_blank">https://ext.dcloud.net.cn/plugin?id=24548</a>

::: danger STOP

For projects created through HBuilderX, do not download uni-router via the command line, but rather through the plugin market.

:::

# Configuration

It is recommended to use easycom to simplify the introduction and registration of components

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

If you are a market through plug-ins into [`HBuilderX`](https://ext.dcloud.net.cn/plugin?id=24548), the need to modify the path components

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

## Configure global component type

When using vscode, to have component type hints and auto-filling, it is necessary to configure the global component type declaration.

```json
// tsconfig.json
{
	"compilerOptions": {
		"types": ["@meng-xi/uni-router/components/index"]
	}
}
```

If you are using WebStorm, you may need to import the index.d.ts file in the main.ts file.

```typescript
// main.ts
import '@meng-xi/uni-router/components/index.d.ts'
```
