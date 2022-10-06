<template lang="pug">
div
	div(v-for="permission in permissionKeys" :key="permission")
		input(
			type="checkbox"
			:id="'permission-' + permission"
			:value="permission"
			v-model="permissions")
		label.inline(:for="'permission-' + permission") {{permissionDescriptions[permission]}}
</template>

<script setup lang="ts">
import {
	encodePermissions,
	parsePermissions,
	PERMISSIONS,
	permissionDescriptions
} from '../../../common/permissions';
import {computed, ref, watch} from 'vue';

const props = defineProps<{modelValue: number}>();
const emit = defineEmits<{(e: 'update:modelValue', permissions: number): void}>();

const permissions = ref<PERMISSIONS[]>(parsePermissions(props.modelValue));
const permissionKeys = computed<string[]>(() => Object.keys(PERMISSIONS).filter((k) => !isNaN(+k)));

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
