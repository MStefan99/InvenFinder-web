<template lang="pug">
div
	div
		input#p-edit-item-amount(
			type="checkbox"
			:value="PERMISSIONS.EDIT_ITEM_AMOUNT"
			v-model="permissions")
		label.inline(for="p-edit-item-amount") Store and retrieve items
	div
		input#p-manage-items(type="checkbox" :value="PERMISSIONS.MANAGE_ITEMS" v-model="permissions")
		label.inline(for="p-manage-items") Edit, add and remove items
	div
		input#p-manage-users(type="checkbox" :value="PERMISSIONS.MANAGE_USERS" v-model="permissions")
		label.inline(for="p-manage-users") Edit, add and remove users
</template>

<script setup lang="ts">
import {encodePermissions, parsePermissions, PERMISSIONS} from '../../../common/permissions';
import {ref, watch} from 'vue';

const props = defineProps<{modelValue: number}>();
const emit = defineEmits<{(e: 'update:modelValue', permissions: number): void}>();

const permissions = ref<PERMISSIONS[]>(parsePermissions(props.modelValue));

watch(
	() => props.modelValue,
	() => (permissions.value = parsePermissions(props.modelValue))
);

watch(permissions, () => {
	emit('update:modelValue', encodePermissions(permissions.value));
});
</script>

<style scoped>
input {
	@apply mr-2;
}
</style>
