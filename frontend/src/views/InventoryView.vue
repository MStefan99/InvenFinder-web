<template lang="pug">
#inventory
	h2.text-accent.text-2xl.mb-4 Inventory
	#items-table
		RouterLink.list-item(
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
	button.mt-4(
		v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
		@click="newItem = defaultItem") Add a new item
	Transition(name="popup")
		.popup-wrapper(v-if="newItem !== null" @click.self="newItem = null")
			form.popup(@submit.prevent="addItem()")
				p.text-2xl.mb-4 New item
				label.mb-2(for="name-input") Name
				input#name-input.mb-4.full(v-model="newItem.name" type="text" placeholder="Some item")
				label.mb-2(for="desc-input") Description
				textarea#desc-input.mb-4.full(v-model="newItem.description" placeholder="Description")
				label.mb-2(for="link-input") Link
				input#link-input.mb-4.full(
					v-model="newItem.link"
					type="text"
					placeholder="https://example.com/your-item")
				label.mb-2(for="location-input") Location
				input#location-input.mb-4.full(v-model="newItem.location" type="text" placeholder="Top drawer")
				label.mb-2(for="amount-input") Amount
				input#amount-input.mb-4.full(v-model="newItem.amount" type="number")
				button(type="submit") Add item
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';

import Api from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import type {Item} from '../scripts/types';

const defaultItem = {
	name: '',
	description: null,
	link: null,
	location: '',
	amount: 10
} as Item;

const items = ref<Item[]>([]);
const newItem = ref<Item | null>(null);

function loadItems() {
	Api.items.getAll().then((i) => (items.value = i));
}

function addItem() {
	if (newItem.value === null) {
		return;
	}

	Api.items.add(newItem.value).then((i) => items.value.push(i));
	newItem.value = null;
}

watch(() => appState.apiKey, loadItems);

onMounted(loadItems);
</script>

<style scoped></style>
