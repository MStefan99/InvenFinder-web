<template lang="pug">
#inventory
	h2.text-accent.text-2xl.mb-4 Inventory
	ItemPicker(:items="items")
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
import {onMounted, ref} from 'vue';

import Api from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import type {Item, NewItem} from '../scripts/types';
import {alert, PopupColor} from '../scripts/popups';
import {useRouter} from 'vue-router';
import ItemPicker from '../components/ItemPicker.vue';

const defaultItem: NewItem = {
	name: '',
	description: null,
	link: null,
	location: '',
	amount: 10
};

const items = ref<Item[]>([]);
const newItem = ref<Item | null>(null);
const router = useRouter();

window.document.title = 'Inventory | Invenfinder';

onMounted(loadItems);

function loadItems() {
	Api.items
		.getAll()
		.then((i) => (items.value = i))
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
</script>

<style scoped></style>
