<template lang="pug">
.editable
	Transition(mode="out-in")
		div(v-if="!expanded || readonly")
			.flex.items-baseline
				.editable-content
					slot(
						:class="[textClass, {'underline cursor-pointer': modelValue && clickable}]"
						:text="value")
						span(@click="modelValue && $emit('click', value)") {{value !== null ? label || value : placeholder}}
				img.icon.ml-2.clickable(src="/src/assets/pen.svg" v-if="!readonly" @click="expanded = true")
		form(v-else @submit.prevent="$emit('update:modelValue', value); expanded = false")
			textarea.w-full(
				v-if="!!multiline"
				:rows="typeof value === 'string' ? value.split(`\n`).length : 2"
				v-model="value")
			input.w-full(v-else :type="type" v-model="value")
			.row.my-4
				button(type="button" @click="value = props.modelValue; expanded = false") Cancel
				button(type="button" @click="value = null") Clear
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
	multiline?: boolean;
	type?: string;
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
