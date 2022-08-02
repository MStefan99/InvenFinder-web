<template lang="pug">
h2.text-accent.text-2xl.mb-4 Item
#item
	.flex.justify-end
		TextEditable(v-model="item.location" text-class="text-9xl font-semibold")
	.flex.justify-between.mb-4
		.grow
			TextEditable(v-model="item.name")
			TextEditable(v-model="item.description" text-class="text-gray-500")
			a.mr-4(:href="item.link") {{item.link}}
		div
			TextEditable(v-model="item.amount" text-class="text-gray-500")
	div(v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])")
		button.mr-4(@click="editAmount(false)") Take from storage
		button(@click="editAmount(true)") Put in storage
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';

import TextEditable from '../components/TextEditable.vue';
import type {Item} from '../scripts/types.ts';
import appState from '../scripts/store.ts';
import Api from '../scripts/api.ts';
import {PERMISSIONS} from '../../../common/permissions.ts';

const item = ref<Item>({
	id: 0,
	name: '',
	description: '',
	location: '',
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

function editAmount(add = false) {
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
.location {
	font-size: 10vh;
}

input {
	@apply block;
}
</style>
