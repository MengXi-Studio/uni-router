<template>
	<view class="router-link" @click="navigate">
		<slot />
	</view>
</template>

<script setup lang="ts">
import { useRouter } from '@meng-xi/uni-router'

const props = defineProps<{
	to: string
	replace?: boolean
}>()

const router = useRouter()

function navigate() {
	if (props.replace) {
		router.replace(props.to)
	} else {
		router.push(props.to)
	}
}
</script>
