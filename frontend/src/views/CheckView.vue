<template lang="pug">
#check
	h2.text-accent.text-2xl.mb-4 Inventory check
	form.flex.mb-4(
		:action="appState.backendURL + '/check'"
		method="post"
		enctype="multipart/form-data"
		@submit.prevent="(e) => uploadFile(e)")
		.row
			label.btn {{fileLabel}}
				input(
					type="file"
					name="file"
					@change="(e) => (fileLabel = e.target.files?.length ? `Selected: ${e.target.files[0].name}` : 'Select a file to upload')")
			button Upload file
	table(v-if="foundItems.length")
		thead
			tr
				th Item
				th Found item
				th Available
				th Needed
				th Remaining
		tbody
			RemainingItems(
				v-for="(item, i) in foundItems"
				:key="item.name"
				:item="item"
				@select="selectedIndex = i")
	p.text-muted.my-2(v-else) Upload a list of items to get started
	Transition(name="popup")
		.popup-wrapper(v-if="selectedIndex > -1" @click.self="selectedIndex = -1")
			.popup
				p.text-2xl.mb-4 Select an item for {{foundItems[selectedIndex].name}}
				ItemPicker(
					:items="items"
					@select="(item) => { foundItems[selectedIndex].foundItem = item; selectedIndex = -1; }"
					:link="false"
					:search-query="false")
</template>

<script setup lang="ts">
import appState from '../scripts/store';
import {onMounted, ref} from 'vue';
import ItemPicker from '../components/ItemPicker.vue';
import type {FoundItem, Item} from '../scripts/types';
import Api from '../scripts/api';
import {alert, PopupColor} from '../scripts/popups';
import RemainingItems from '../components/RemainingItems.vue';

const fileLabel = ref<string>('Select a file to upload');
const items = ref<Item[]>([]);
const foundItems = ref<FoundItem[]>([]);
const selectedIndex = ref<number>(-1);

window.document.title = 'Inventory check | Invenfinder';

onMounted(loadItems);

function loadItems() {
	Api.items
		.getAll()
		.then((i) => (items.value = i))
		.catch((err) => alert('Could not load inventory', PopupColor.Red, err.message));
}

async function uploadFile(e: SubmitEvent) {
	const body = new FormData();
	for (const file of ((e.target as HTMLFormElement).file as HTMLInputElement).files) {
		body.append('file', file);
	}

	foundItems.value = [];

	const res = await fetch(`${appState.backendURL}/check`, {
		method: 'POST',
		body
	});

	if (res.ok) {
		const decoder = new TextDecoder();
		let buffer = '';

		//@ts-expect-error TS doesn't know res.body has an async iterator
		for await (const chunk of res.body) {
			const text = decoder.decode(chunk);
			buffer += text;
			const fullEntries = buffer.split('\n');
			buffer = fullEntries.pop();
			fullEntries.forEach((e) => foundItems.value.push(JSON.parse(e)));
		}
	}
}
</script>

<style scoped>
table {
	@apply w-full;
}

th {
	@apply text-left;
}

tr {
	@apply border-b;
}
</style>
