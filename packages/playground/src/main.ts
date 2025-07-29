import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

export function createApp() {
	const app = createSSRApp(App)

	app.config.globalProperties.$router = router

	return {
		app
	}
}
