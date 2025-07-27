<template>
	<navigator>
		<template #default v-if="slots.default">
			<slot></slot>
		</template>
	</navigator>
</template>

<script setup lang="ts">
import { type Slots, useSlots } from 'vue'

const slots: Slots = useSlots()
console.log(slots.default)
</script>
