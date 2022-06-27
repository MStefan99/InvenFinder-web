<template lang="pug">
#inventory
	h2.text-accent.text-2xl.mb-4 Inventory
	#items-table
		RouterLink.item(
			:to="{name: 'item', params: {id: item.id}}"
			v-for="item in items"
			:key="item.id")
			.flex.justify-between
				div
					.mr-4.font-light {{item.name}}
					.mr-4.text-gray-500 {{item.description}}
				div
					.text-right.font-semibold {{item.location}}
					.text-right.text-gray-500 {{item.amount}}
</template>

<script setup lang="ts">
import Api from '../scripts/api';
import appState from '../scripts/store';
import type {Item} from '../scripts/api';
import {onMounted, ref, watch} from 'vue';

let items = ref<Item[]>([]);

function loadItems() {
	Api.items.getAll().then((i) => (items.value = i));
}

watch(() => appState.data.apiKey, loadItems);

onMounted(loadItems);
</script>

<style scoped>
.item {
	display: block;
	border-bottom: 1px solid var(--color-separator);
	padding: 1em 0;
}
</style>
