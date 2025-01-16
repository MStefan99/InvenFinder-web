<template lang="pug">
tr
	td {{item.name}}
	td
		button(@click="emit('select')") {{item.foundItem?.name ?? 'Choose'}}
	td {{item.amount}}
	td(:class="{insufficient: remaining.factor < 1}") {{item.foundItem?.amount ?? 'None'}}
	td(
		:class="{enough: remaining.factor > 3, low: remaining.factor <= 3, insufficient: remaining.factor < 1}") {{remaining.factor > 0 ? remaining.amount : 'Not enough'}}
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {FoundItem} from '../scripts/types';

const props = defineProps<{item: FoundItem}>();
const emit = defineEmits<{(e: 'select'): void}>();

const remaining = computed(() => {
	const amount = props.item.foundItem ? props.item.foundItem?.amount - props.item.amount : null;
	const factor = props.item.foundItem ? props.item.foundItem?.amount / props.item.amount : 0;

	return {amount, factor};
});
</script>

<style scoped>
td {
	@apply py-2;
}

.enough {
	@apply text-green;
}

.low {
	@apply text-yellow;
}

.insufficient {
	@apply text-red;
}
</style>
