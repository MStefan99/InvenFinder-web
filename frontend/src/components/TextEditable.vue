<template lang="pug">
.editable
	.flex.items-baseline(v-if="!expanded || readonly")
		span(
			:class="[textClass, {'underline cursor-pointer': modelValue && clickable}]"
			@click="modelValue && $emit('click', value)") {{value !== null ? label || value : placeholder}}
		img.icon.ml-2.clickable(src="/src/assets/pen.svg" v-if="!readonly" @click="expanded = true")
	form(v-else @submit.prevent="$emit('update:modelValue', value); expanded = false")
		textarea.full(rows="1" v-model="value")
		.my-4
			button.mr-4(type="button" @click="value = props.modelValue; expanded = false") Cancel
			button.mr-4(type="button" @click="value = null") Clear
			button.green(type="submit") Save
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';

const props = defineProps<{
	modelValue: string | number | null;
	label?: string;
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
.icon {
	display: inline-block;
}
</style>
