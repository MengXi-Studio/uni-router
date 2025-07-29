declare module 'vue' {
	export interface GlobalComponents {
		Router: typeof import('./router/router.vue').default
	}
}

export {}
