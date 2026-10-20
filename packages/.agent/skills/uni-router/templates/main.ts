// src/main.ts
// app.use(router) 做了三件事：注册 $router/$route、provide/inject（useRouter 可用）、
// 注入全局 mixin 在每个页面 onShow 自动 syncRoute()，并 markReady 让 isReady() resolve。
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
	const app = createSSRApp(App)
	app.use(router)
	return { app }
}
