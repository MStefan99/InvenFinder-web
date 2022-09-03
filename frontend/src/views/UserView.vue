<template lang="pug">
#user(v-if="user")
	h2.text-accent.text-2xl.mb-4 User
	.mb-6
		label(for="username-input") Username
		input#username-input.block.my-2(type="text" v-model="user.username")
	h3.text-accent.text-lg.mb-4 Permissions
	form.permissions(@submit.prevent="editUser")
		PermissionSelector.mb-4(v-model="user.permissions")
		button.mr-4(type="submit") Save
		button.red(type="button" @click="deleteUser") Delete
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import type {User} from '../scripts/types';
import {useRoute, useRouter} from 'vue-router';
import {UserAPI} from '../scripts/api';
import appState from '../scripts/store';
import {hasPermissions, PERMISSIONS} from '../../../common/permissions';
import {alert, confirm, PopupColor} from '../scripts/popups';
import PermissionSelector from '../components/PermissionSelector.vue';

const user = ref<User | null>(null);
const route = useRoute();
const router = useRouter();

onMounted(() => {
	if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
		alert('Not allowed', PopupColor.Red, 'You do not have permissions to view this page');
		return;
	}

	if (Array.isArray(route.params.id)) {
		throw new Error('ID must not be an array');
	}
	const id = +route.params.id;

	if (!Number.isInteger(id)) {
		throw new Error('ID must be a number');
	}

	UserAPI.getByID(+route.params.id).then((u) => {
		user.value = u;
	});
});

async function editUser() {
	if (
		user.value.username === appState.user.username &&
		!hasPermissions(appState.user.permissions, user.value.permissions) &&
		!(await confirm(
			'You are about to lose permissions!',
			PopupColor.Red,
			'Be careful! You are going to revoke permissions from yourself and ' +
				'you might not be able to regain them if you proceed. ' +
				'Are you sure this is what you intended to do and you want to continue?'
		))
	) {
		return;
	}

	UserAPI.edit(user.value).then(() =>
		alert('Saved', PopupColor.Green, 'User was saved successfully')
	);
}

async function deleteUser() {
	if (
		await confirm(
			'Delete this user?',
			PopupColor.Red,
			'Are you sure you want to delete ' + user.value.username + '?'
		)
	) {
		UserAPI.delete(user.value).then(() => router.push({name: 'users'}));
	}
}
</script>

<style scoped>
input[type='checkbox'] {
	@apply mr-4;
}
</style>
