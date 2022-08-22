<template lang="pug">
div
	span(v-if="!expanded || readonly" :class="textClass" @contextmenu.prevent="expanded = true") {{value}}
	form(v-else @submit.prevent="$emit('update:modelValue', value); expanded = false")
		input(type="text" v-model="value")
		.my-4
			button.mr-4(type="button" @click="value = props.modelValue; expanded = false") Cancel
			button(type="submit") Save
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';

const props = defineProps<{modelValue: string | number; textClass?: string; readonly?: boolean}>();
defineEmits(['update:modelValue']);

const value = ref<string | number>(props.modelValue);
const expanded = ref<boolean>(false);

watch(
	() => props.modelValue,
	() => {
		value.value = props.modelValue;
	}
);
</script>

<style scoped>
input {
	width: 100%;
}
</style>
