<template lang="pug">
div
	.no-print
		input.w-full(v-model="fontSize" type="range" min="0.2" max="5" step="0.01")
		p Font size: {{Math.floor(fontSize * 100)}}%
	.flex.flex-wrap(:style="'font-size:' + fontSize + 'em'")
		.label.m-1.p-1(v-for="item in items" :key="item")
			p.font-bold {{item.location}}
			p {{item.name}}
</template>

<script setup lang="ts">
import {ref} from 'vue';

import Api from '../scripts/api';
import type {Item} from '../scripts/types';

const items = ref<Item[]>();
const fontSize = ref<number>(1);

Api.items.getAll().then((i) => (items.value = i));
</script>

<style scoped>
.label {
	border: 1px dashed var(--color-muted);
}
</style>
