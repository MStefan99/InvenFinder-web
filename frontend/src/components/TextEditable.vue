<template lang="pug">
.mx-2
	span(v-if="!expanded" :class="textClass" @click="expanded = true") {{value}}
	div(v-else)
		input(type="text" v-model="value")
		.mb-4
			button.mr-4(type="button" @click="value = props.modelValue; expanded = false") Cancel
			button(type="button" @click="$emit('update:modelValue', value); expanded = false") Save
</template>

<script setup lang="ts">
import {defineEmits, defineProps, ref, watch} from 'vue';

const props = defineProps<{modelValue: string; textClass: string}>();
defineEmits(['update:modelValue']);

const value = ref<string>(props.modelValue);
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
