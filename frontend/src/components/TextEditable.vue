<template lang="pug">
div
	span(v-if="!expanded || readonly" :class="textClass" @click="expanded = true") {{value}}
	div(v-else)
		input(type="text" v-model="value")
		.mb-4
			button.mr-4(type="button" @click="value = props.modelValue; expanded = false") Cancel
			button(type="button" @click="$emit('update:modelValue', value); expanded = false") Save
</template>

<script setup lang="ts">
import {defineEmits, defineProps, ref, watch} from 'vue';

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
