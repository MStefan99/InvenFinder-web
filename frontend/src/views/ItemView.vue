<template lang="pug">
#item
	h2.text-accent.text-2xl.mb-4 Item details
	div(v-if="item")
		.flex.justify-between
			.grow.mr-2
				TextEditable.mb-2(
					v-model="item.name"
					text-class="text-2xl font-bold"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
					@update:modelValue="editItem")
				.flex.items-baseline.mb-4
					img.icon.mr-2(src="/src/assets/shelf.svg")
					TextEditable.grow(
						v-model="item.location"
						text-class="text-xl font-semibold"
						:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
						@update:modelValue="editItem")
			.shrink-0.flex.items-baseline
				img.icon.mr-2(src="/src/assets/warehouse.svg")
				TextEditable(
					v-model="item.amount"
					text-class="text-muted"
					@update:modelValue="editItem"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])")
		TextEditable.mb-2(
			v-model="item.description"
			placeholder="No description"
			text-class="text-muted"
			:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
			@update:modelValue="editItem")
		TextEditable.mb-4(
			v-model="item.link"
			label="More details"
			placeholder="No link"
			text-class="text-muted"
			clickable
			@click="openURL(item.link)"
			@update:modelValue="editItem"
			:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])")
		div(v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])")
			button.mr-4(@click="editAmount(false)") Take from storage
			button.mr-4(@click="editAmount(true)") Put in storage
			button.red(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])" @click="deleteItem") Delete item
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

import TextEditable from '../components/TextEditable.vue';
import type {Item} from '../scripts/types';
import appState from '../scripts/store';
import Api from '../scripts/api';
import {PERMISSIONS} from '../../../common/permissions';
import {alert, confirm, PopupColor, prompt} from '../scripts/popups';

const item = ref<Item | null>(null);
const route = useRoute();
const router = useRouter();

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.items
		.getByID(id)
		.then((i) => {
			item.value = i;
		})
		.catch((err) => alert('Could not load the item', PopupColor.Red, err.message));
});

function openURL(url: string) {
	window.location.href = url;
}

function editItem() {
	item.value &&
		Api.items
			.edit(item.value)
			.then((i) => (item.value = i))
			.catch((err) =>
				alert('Could not save ' + item.value.name || 'the item', PopupColor.Red, err.message)
			);
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

	if (item.value.amount < 0) {
		alert(
			'Invalid amount',
			PopupColor.Red,
			'You have entered an invalid amount ' +
				'as the number of items would turn negative. Please try again.'
		);
		item.value.amount = oldAmount;
		return;
	}

	Api.items
		.editAmount(item.value.id, item.value.amount)
		.then((i) => (item.value.amount = i.amount))
		.catch((err) => {
			item.value.amount = oldAmount;
			alert('Could not change the amount', PopupColor.Red, err.message);
		});
}

async function deleteItem() {
	if (
		await confirm(
			'Delete this item?',
			PopupColor.Red,
			'Are you sure you want to delete ' + item.value.name + '?'
		)
	) {
		Api.items
			.delete(item.value)
			.then(() => router.push({name: 'home'}))
			.catch((err) =>
				alert('Could not delete ' + item.value.name || 'the item', PopupColor.Red, err.message)
			);
	}
}
</script>

<style scoped>
input {
	@apply block;
}
</style>
