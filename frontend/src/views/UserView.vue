<template lang="pug">
#user
	h2.text-accent.text-2xl.mb-4 User
	.mb-6
		p {{user?.username}}
	h3.text-accent.text-lg.mb-4 Permissions
	form.permissions(@submit.prevent="save")
		div
			input(
				type="checkbox"
				:checked="hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT], permissions)"
				@change="setPermission(PERMISSIONS.EDIT_ITEM_AMOUNT, $event.target.checked)")
			label Store and retrieve items
		div
			input(
				type="checkbox"
				:checked="hasPermissions([PERMISSIONS.MANAGE_ITEMS], permissions)"
				@change="setPermission(PERMISSIONS.MANAGE_ITEMS, $event.target.checked)")
			label Edit, add and remove items
		.mb-4
			input(
				type="checkbox"
				:checked="hasPermissions([PERMISSIONS.MANAGE_USERS], permissions)"
				@change="setPermission(PERMISSIONS.MANAGE_USERS, $event.target.checked)")
			label Edit, add and remove users
		button(type="submit") Save
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {User} from '../scripts/types';
import {useRoute} from 'vue-router';
import {UserAPI} from '../scripts/api';
import appState from '../scripts/store';
import {
	encodePermissions,
	parsePermissions,
	hasPermissions,
	PERMISSIONS
} from '../../../common/permissions';
import {alert, confirm, PopupColor} from '../scripts/popups';

const user = ref<User | null>(null);
const permissions = ref<PERMISSIONS[]>([]);
const route = useRoute();

if (Array.isArray(route.params.username)) {
	throw new Error('Username parameter must not be an array');
}

if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
	alert('Not allowed', PopupColor.Red, 'You do not have permissions to view this page');
}

UserAPI.getByUsername(route.params.username).then((u) => {
	user.value = u;
	permissions.value = parsePermissions(u.permissions);
});

function setPermission(permission: PERMISSIONS, set: boolean) {
	if (!set) {
		permissions.value = permissions.value.filter((p) => p !== permission);
	} else {
		permissions.value.some((p) => p === permission) || permissions.value.push(permission);
	}
}

async function save() {
	if (
		user.value.id === appState.user.id &&
		!hasPermissions(user.value.permissions, permissions.value) &&
		!(await confirm(
			'You are about to lose permissions!',
			PopupColor.Red,
			'Be careful! You are going to revoke permissions from yourself and ' +
				'you might not be able to regain them if you proceed. ' +
				'Are you sure this is what you intended to do and you want to continue?'
		))
	) {
		permissions.value = parsePermissions(appState.user.permissions);
		return;
	}
	user.value.permissions = encodePermissions(permissions.value);

	UserAPI.edit(user.value);
}
</script>

<style scoped>
input[type='checkbox'] {
	@apply mr-4;
}
</style>
