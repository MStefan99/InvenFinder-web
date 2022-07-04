<template lang="pug">
.popup-wrapper(@click="$emit('close')")
	.popup
		form
			.mb-4
				p.text-2xl New item
			label(for="name-input") Name
			input#name-input(type="text" placeholder="Some item" v-model="item.name")
</template>

<script setup lang="ts">
import {reactive} from 'vue';

import type {Item} from '../scripts/types.ts';

const item = reactive<Item>({});
</script>

<style scoped></style>
