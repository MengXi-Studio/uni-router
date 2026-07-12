<template>
	<navigator :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime" @click.stop.prevent="navigate">
		<slot />
	</navigator>
</template>

<script setup lang="ts">
import { useRouter, type NavigationResult, type NavigationFailure } from '@meng-xi/uni-router'
import type { RouterLinkProps, RouterLinkEmits } from './type'

const props = withDefaults(defineProps<RouterLinkProps>(), {
	hoverClass: 'navigator-hover',
	hoverStopPropagation: false,
	hoverStartTime: 50,
	hoverStayTime: 600
})

const emit = defineEmits<RouterLinkEmits>()

/** 导航器实例 */
const router = useRouter()

/** 导航到目标页面 */
async function navigate() {
	try {
		let result: NavigationResult
		if (props.relaunch) {
			result = await router.relaunch(props.to)
		} else if (props.replace) {
			result = await router.replace(props.to)
		} else {
			result = await router.push(props.to)
		}
		emit('navigated', result.eventChannel)
	} catch (error) {
		emit('error', error as NavigationFailure)
	}
}

defineOptions({ name: 'RouterLink' })
</script>
