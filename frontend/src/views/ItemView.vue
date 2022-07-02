<template lang="pug">
h2.text-accent.text-2xl.mb-4 Item
#item
	.flex.justify-between.mb-4
		//- TODO: editable fields are cool but resizing inputs is pain™
		div
			input.plain.mr-4.font-light(v-model="item.name")
			input.plain.mr-4.text-gray-500(v-model="item.description")
		div
			input.plain.text-right.font-semibold(v-model="item.location")
			input.plain.text-right.text-gray-500(v-model="item.amount")
	div(v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])")
		button.mr-4(@click="editAmount(false)") Take from storage
		button(@click="editAmount(true)") Put in storage
</template>

<script setup lang="ts">
import type {Item} from '../scripts/types.ts';
import appState from '../scripts/store.ts';
import {PERMISSIONS} from '../../../common/permissions.ts';
import Api from '../scripts/api.ts';
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';

const item = ref<Item>({
	id: 0,
	name: 'Loading...',
	description: null,
	location: 'Loading...',
	amount: 0
});

const route = useRoute();

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.items.getByID(id).then((i) => {
		if (i === null) {
			return;
		}

		item.value = i;
	});
});

function editAmount(add: boolean = false) {
	const diff = +prompt('Choose amount');

	if (Number.isNaN(diff)) {
		return;
	}

	const oldAmount = item.value.amount;
	item.value.amount = add ? item.value.amount + diff : item.value.amount - diff;

	Api.items.editAmount(item.value.id, item.value.amount).then((i) => {
		if (i === null) {
			item.value.amount = oldAmount;
			return;
		}

		item.value.amount = i.amount;
	});
}
</script>

<style scoped>
input {
	@apply block;
}
</style>
