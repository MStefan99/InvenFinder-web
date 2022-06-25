<template lang="pug">
ul
	li.mb-4(v-for="item in items")
		.item
			span.mr-4 {{item.name}}
			span.mr-4 {{item.description}}
			span.mr-4 {{item.location}}
			span.mr-4 {{item.amount}}
</template>

<script setup lang="ts">
import Api from '../scripts/api';
import appState from '../scripts/store';
import type {Item} from '../scripts/api';
import {onMounted, ref, watch} from 'vue';

let items = ref<Item[]>([]);

function loadItems() {
	Api.items.getAll().then((i) => (items.value = i));
}

watch(() => appState.data.apiKey, loadItems);

onMounted(loadItems);
</script>

<style scoped></style>
