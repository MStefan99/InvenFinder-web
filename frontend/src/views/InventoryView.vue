<template lang="pug">
#inventory
	h2.text-accent.text-2xl.mb-4 Inventory
	.row.my-2
		input.grow(placeholder="Search here..." v-model="searchString" @input="search(searchString)")
		button(@click="searchString = ''; search(searchString)") Clear
	#items-table
		p.filler(v-if="!items.length") Oh no, your inventory is empty! Once you have some items, they will appear here
		p.filler(v-else-if="!filteredItems.length") No items matched your search. Please try something else
		RouterLink.list-item(
			v-else
			v-for="item in filteredItems"
			:key="item.id"
			:to="{name: 'item', params: {id: item.id}}")
			.flex.justify-between
				div
					.mr-4 {{truncate(item.name, 40)}}
					.mr-4.text-muted {{truncate(item.description, 180) || 'No description'}}
				div
					.text-right.font-semibold {{truncate(item.location, 20)}}
					.text-right.text-muted {{item.amount}}
		button.fab(
			v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
			@click="newItem = defaultItem") New item
	Transition(name="popup")
		.popup-wrapper(v-if="newItem !== null" @click.self="newItem = null")
			form.popup(@submit.prevent="addItem()")
				p.text-2xl.mb-4 New item
				label.mb-2(for="name-input") Name
				input#name-input.mb-4.w-full(v-model="newItem.name" type="text" placeholder="Some item")
				label.mb-2(for="desc-input") Description
				textarea#desc-input.mb-4.w-full(v-model="newItem.description" placeholder="Description")
				label.mb-2(for="link-input") Link
				input#link-input.mb-4.w-full(
					v-model="newItem.link"
					type="text"
					placeholder="https://example.com/your-item")
				label.mb-2(for="location-input") Location
				input#location-input.mb-4.w-full(
					v-model="newItem.location"
					type="text"
					placeholder="Top drawer")
				label.mb-2(for="amount-input") Amount
				input#amount-input.mb-4.w-full(v-model="newItem.amount" type="number")
				button(type="submit") Add item
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';

import Api from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import type {Item, NewItem} from '../scripts/types';
import {alert, PopupColor} from '../scripts/popups';
import {useQuery} from '../scripts/composables';
import {useRouter} from 'vue-router';

const defaultItem: NewItem = {
	name: '',
	description: null,
	link: null,
	location: '',
	amount: 10
};

const items = ref<Item[]>([]);
const filteredItems = ref<Item[]>([]);
const newItem = ref<Item | null>(null);
const searchString = ref<string>('');
const router = useRouter();
let debounceHandle: number | undefined = undefined;

const {query} = useQuery(
	computed(() => ({
		search: searchString.value
	}))
);
searchString.value = Array.isArray(query.value.search) ? query.value.search[0] : query.value.search;

window.document.title = 'Inventory | Invenfinder';

onMounted(loadItems);

function loadItems() {
	Api.items
		.getAll()
		.then((i) => {
			filteredItems.value = items.value = i;
			if (searchString.value) {
				search(searchString.value);
			}
		})
		.catch((err) => alert('Could not load inventory', PopupColor.Red, err.message));
}

function addItem() {
	if (newItem.value === null) {
		return;
	}

	Api.items
		.add(newItem.value)
		.then((i) => {
			items.value.push(i);
			router.push({name: 'item', params: {id: i.id}});
		})
		.catch((err) =>
			alert('Could not add ' + newItem.value.name || 'the item', PopupColor.Red, err.message)
		);
}

function search(query: string) {
	const foundItems: Item[] = [];
	const q = query.trim().toLowerCase();

	if (!q) {
		filteredItems.value = items.value;
	} else {
		for (const item of items.value) {
			if (
				item.name.toLowerCase().includes(q) ||
				item.description?.toLowerCase()?.includes(q) ||
				item.location.toLowerCase() === q
			) {
				foundItems.push(item);
			}
		}
		filteredItems.value = foundItems;

		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => {
			Api.items.search(q).then((i) => {
				if (i.length > filteredItems.value.length) {
					filteredItems.value = i;
					alert('Search results enhanced', PopupColor.Green, 'Better results coming your way!');
				}
			});
		}, 2000);
	}
}

function truncate(text: string | null, length: number): string {
	if (text === null) {
		return '';
	}

	if (text.length > length) {
		return text.substring(0, length - 1) + '…';
	} else {
		return text;
	}
}
</script>

<style scoped></style>
