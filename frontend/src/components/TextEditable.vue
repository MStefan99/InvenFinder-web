<template lang="pug">
.editable
	span(
		v-if="!expanded || readonly"
		:class="[textClass, {'underline cursor-pointer': modelValue && clickable}]"
		@click="modelValue && $emit('click', value)"
		@contextmenu.prevent="expanded = true") {{value ?? placeholder}}
	form(v-else @submit.prevent="$emit('update:modelValue', value); expanded = false")
		input(type="text" v-model="value")
		.my-4
			button.mr-4(type="button" @click="value = props.modelValue; expanded = false") Cancel
			button.mr-4(type="button" @click="value = null") Clear
			button.green(type="submit") Save
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';

const props = defineProps<{
	modelValue: string | number | null;
	placeholder?: string;
	textClass?: string;
	readonly?: boolean;
	clickable?: boolean;
}>();
defineEmits<{
	(e: 'update:modelValue', value: string | number): void;
	(e: 'click'): void;
}>();

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
