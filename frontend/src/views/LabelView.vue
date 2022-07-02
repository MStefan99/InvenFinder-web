<template lang="pug">
.flex.flex-wrap
	.label.m-2.p-2(v-for="item in items")
		p.font-bold {{item.location}}
		p {{item.name}}
</template>

<script setup lang="ts">
import {ref} from 'vue';

import Api from '../scripts/api.ts';
import type {Item} from '../scripts/types.ts';

const items = ref<Item[]>();

Api.items.getAll().then((i) => (items.value = i));
</script>

<style scoped>
.label {
	border: 1px dashed var(--color-muted);
}
</style>
