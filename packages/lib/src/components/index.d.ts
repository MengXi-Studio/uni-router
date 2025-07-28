declare module 'vue' {
	export interface GlobalComponents {
		Link: typeof import('@/components/link/link.vue').default
	}
}

export {}
