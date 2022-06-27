<template lang="pug">
h2.text-accent.text-2xl.mb-4 Item
#item
	.flex.justify-between.mb-4
		div
			.mr-4.font-light {{item.name}}
			.mr-4.text-gray-500 {{item.description}}
		div
			.text-right.font-semibold {{item.location}}
			.text-right.text-gray-500 {{item.amount}}
	button.mr-4 Take from storage
	button Put in storage
</template>

<script setup lang="ts">
import type {Item} from '../scripts/api';
import Api from '../scripts/api';
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';

const item = ref<Item>({
	id: 0,
	name: 'Loading...',
	description: null,
	location: 'Loading...',
	amount: 0
});

const route = useRoute();

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.items.getByID(id).then((i) => (item.value = i));
});
</script>

<style scoped></style>
