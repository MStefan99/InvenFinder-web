<template lang="pug">
#item
	h2.text-accent.text-2xl.mb-4 Item details
	div(v-if="item")
		.flex.justify-end
			TextEditable(
				v-model="item.location"
				text-class="text-9xl font-semibold"
				:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
				@update:modelValue="updateItem")
		.flex.justify-between
			.grow.mr-2
				TextEditable(
					v-model="item.name"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
					@update:modelValue="updateItem")
				TextEditable(
					v-model="item.description"
					text-class="text-gray-500"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
					@update:modelValue="updateItem")
				a.mr-4(:href="item.link") {{item.link}}
			div
				TextEditable(
					v-model="item.amount"
					text-class="text-gray-500"
					@update:modelValue="updateItem"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])")
		p.text-gray-500.mb-4(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])") Right-click to edit
		div(v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])")
			button.mr-4(@click="editAmount(false)") Take from storage
			button(@click="editAmount(true)") Put in storage
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';

import TextEditable from '../components/TextEditable.vue';
import type {Item} from '../scripts/types';
import appState from '../scripts/store';
import Api from '../scripts/api';
import {PERMISSIONS} from '../../../common/permissions';
import {PopupColor, prompt} from '../scripts/popups';

const item = ref<Item | null>(null);
const route = useRoute();

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.items.getByID(id).then((i) => {
		item.value = i;
	});
});

function updateItem() {
	item.value && Api.items.edit(item.value).then((i) => (item.value = i));
}

async function editAmount(add = false) {
	const diff = +((await prompt('Choose amount', PopupColor.Green)) ?? 0);

	if (Number.isNaN(diff)) {
		return;
	}

	if (!item.value) {
		return;
	}

	const oldAmount = item.value.amount;
	item.value.amount = add ? item.value.amount + diff : item.value.amount - diff;

	Api.items
		.editAmount(item.value.id, item.value.amount)
		.then((i) => (item.value.amount = i.amount))
		.catch(() => (item.value.amount = oldAmount));
}
</script>

<style scoped>
.location {
	font-size: 10vh;
}

input {
	@apply block;
}
</style>
