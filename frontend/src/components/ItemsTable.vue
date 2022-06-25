<template lang="pug">
#items-table
	RouterLink.item(:to="{name: 'item', params: {id: item.id}}" v-for="item in items" :key="item.id")
		.flex.justify-between.mb-4
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

<style scoped></style>
