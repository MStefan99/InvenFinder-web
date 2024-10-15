<template lang="pug">
#file
	.flex.flex-col.h-full
		h2.text-accent.text-2xl.mb-4 Document
		b Name: {{route.params.file}}
		iframe(
			v-if="cookie"
			:src="appState.backendURL + '/items/' + route.params.id + '/files/' + route.params.file")
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import Api from '../scripts/api';
import appState from '../scripts/store';
import {useRoute} from 'vue-router';
import type {Item} from '../scripts/types';
import {alert, PopupColor} from '../scripts/popups';

const cookie = ref<boolean>(false);
const route = useRoute();
const item = ref<Item | null>(null);

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.auth
		.getCookie()
		.then(() => (cookie.value = true))
		.catch((err) => alert('Could not open the file', PopupColor.Red, err.message));

	Api.items
		.getByID(id)
		.then((i) => {
			item.value = i;
			window.document.title = i.name + ' | Invenfinder';
		})
		.catch((err) => alert('Could not load the item', PopupColor.Red, err.message));
});
</script>

<style scoped>
#file {
	height: 100%;
}

iframe {
	min-height: 100px;
	flex-grow: 1;
}
</style>
