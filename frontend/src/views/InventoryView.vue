<template lang="pug">
#inventory
	h2.text-accent.text-2xl.mb-4 Inventory
	#items-table
		RouterLink.item(
			v-for="item in items"
			:key="item.id"
			:to="{name: 'item', params: {id: item.id}}")
			.flex.justify-between
				div
					.mr-4 {{item.name}}
					.mr-4.text-gray-500 {{item.description}}
				div
					.text-right.font-semibold {{item.location}}
					.text-right.text-gray-500 {{item.amount}}
	button.mt-4(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])" @click="addingItem = true") Add a new item
	Transition(name="popup")
		.popup-wrapper(v-if="addingItem === true" @click="addingItem = false")
			form.popup
				.mb-4
					p.text-2xl New item
				label(for="name-input") Name
				input#name-input.full(v-model="editedItem.name" type="text" placeholder="Some item")
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';

import Api from '../scripts/api.ts';
import appState from '../scripts/store.ts';
import {PERMISSIONS} from '../../../common/permissions.ts';
import type {Item} from '../scripts/types.ts';

const items = ref<Item[]>([]);
const addingItem = ref<boolean>(false);
const editedItem = ref<Item | null>({});

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
