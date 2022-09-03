<template lang="pug">
div
	div
		input(type="checkbox" v-model="permissionInputs[PERMISSIONS.EDIT_ITEM_AMOUNT]")
		label.inline Store and retrieve items
	div
		input(type="checkbox" v-model="permissionInputs[PERMISSIONS.MANAGE_ITEMS]")
		label.inline Edit, add and remove items
	div
		input(type="checkbox" v-model="permissionInputs[PERMISSIONS.MANAGE_USERS]")
		label.inline Edit, add and remove users
</template>

<script setup lang="ts">
import {encodePermissions, parsePermissions, PERMISSIONS} from '../../../common/permissions';
import {ref, watch} from 'vue';

const props = defineProps<{modelValue: number}>();
const emit = defineEmits<{(e: 'update:modelValue', permissions: number): void}>();

const permissionInputs = ref<boolean[]>(getInputs());

function getInputs() {
	return parsePermissions(props.modelValue).reduce<boolean[]>(
		(previousValue, currentValue, currentIndex) => {
			previousValue[currentIndex] = true;
			return previousValue;
		},
		[]
	);
}

watch(
	() => props.modelValue,
	() => (permissionInputs.value = getInputs())
);

watch(
	permissionInputs,
	() => {
		const val = encodePermissions(
			permissionInputs.value.reduce<PERMISSIONS[]>((previousValue, currentValue, currentIndex) => {
				if (currentValue) {
					previousValue.push(currentIndex);
				}
				return previousValue;
			}, [])
		);
		emit('update:modelValue', val);
	},
	{deep: true}
);
</script>

<style scoped></style>
