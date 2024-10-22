<template lang="pug">
.item-picker
	.row.my-2
		input.grow(placeholder="Search here..." v-model="searchString" @input="search(searchString)")
		button(@click="searchString = ''; search(searchString)") Clear
	.item-table
		p.filler(v-if="!items.length") Your inventory is empty! Once you have some items, they will appear here
		p.filler(v-else-if="!filteredItems.length") No items matched your search. Please try something else
		Component.list-item(
			v-else
			v-for="item in filteredItems"
			@click="emit('select', item)"
			:key="item.id"
			:is="link ? RouterLink : 'span'"
			:to="{name: 'item', params: {id: item.id}}")
			.flex.justify-between
				div
					.mr-4 {{truncate(item.name, 40)}}
					.mr-4.text-muted {{truncate(item.description, 180) || 'No description'}}
				div
					.text-right.font-semibold {{truncate(item.location, 20)}}
					.text-right.text-muted {{item.amount}}
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import type {Item} from '../scripts/types';
import {useQuery} from '../scripts/composables';
import Api from '../scripts/api';
import {alert, PopupColor} from '../scripts/popups';
import {RouterLink} from 'vue-router';

const props = withDefaults(defineProps<{items: Item[]; searchQuery?: boolean; link?: boolean}>(), {
	searchQuery: true,
	link: true
});
const emit = defineEmits<{(e: 'select', item: Item): void}>();

const filteredItems = ref<Item[]>(props.items);
let debounceHandle: number | undefined = undefined;
const searchString = ref<string>('');

if (props.searchQuery) {
	const {query} = useQuery(
		computed(() => ({
			search: searchString.value
		}))
	);
	searchString.value = Array.isArray(query.value.search)
		? query.value.search[0]
		: query.value.search;
}

watch(
	() => props.items,
	(items) => {
		filteredItems.value = items;
		if (searchString.value) {
			search(searchString.value, true);
		}
	}
);

function search(query: string, immediate = false) {
	const items: Item[] = [];
	const q = query.trim().toLowerCase();

	if (!q) {
		filteredItems.value = props.items;
		clearTimeout(debounceHandle);
	} else {
		for (const item of props.items) {
			if (
				item.name.toLowerCase().includes(q) ||
				item.description?.toLowerCase()?.includes(q) ||
				item.location.toLowerCase() === q
			) {
				items.push(item);
			}
		}
		filteredItems.value = items;

		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(
			() => {
				Api.items.search(q).then((i) => {
					if (i.length > filteredItems.value.length) {
						filteredItems.value = i;
						!immediate &&
							alert('Search results enhanced', PopupColor.Green, 'Better results coming your way!');
					}
				});
			},
			immediate ? 0 : 1000
		);
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
