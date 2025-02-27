<template lang="pug">
#user(v-if="user")
	h2.text-accent.text-2xl.mb-4 User
	.mb-4
		label.mb-2(for="username-input") Username
		TextEditable(
			type="text"
			v-model="user.username"
			:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])"
			@update:modelValue="editUser()")
	div(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_USERS])")
		h3.text-accent.text-lg.mb-4 Permissions
		form.permissions.mb-4(@submit.prevent="editUser()")
			PermissionSelector.mb-4(v-model="user.permissions")
			.row
				button(type="submit") Save
				button.red(type="button" @click="deleteUser()") Delete
	UserLoans(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])" :loans="loans")
		span User has no active loans
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import type {ItemLoan, User} from '../scripts/types';
import {useRoute, useRouter} from 'vue-router';
import Api from '../scripts/api';
import appState from '../scripts/store';
import {hasPermissions, PERMISSIONS} from '../../../common/permissions';
import {alert, confirm, PopupColor} from '../scripts/popups';
import PermissionSelector from '../components/PermissionSelector.vue';
import UserLoans from '../components/UserLoans.vue';
import TextEditable from '../components/TextEditable.vue';

const user = ref<User | null>(null);
const loans = ref<ItemLoan[]>([]);
const route = useRoute();
const router = useRouter();

onMounted(() => {
	if (!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS, PERMISSIONS.MANAGE_USERS], true)) {
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

	Api.users
		.getByID(+route.params.id)
		.then((u) => {
			user.value = u;
			window.document.title = `User ${u.username} | Invenfinder`;
			if (!route.params.username) {
				router.replace({name: 'user', params: {id, username: u.username}});
			}
		})
		.catch((err) => alert('Could not load user details', PopupColor.Red, err.message));

	appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS]) &&
		Api.loans
			.getByUser(+route.params.id)
			.then((l) => {
				loans.value = l;
			})
			.catch((err) => alert('Could not load loans', PopupColor.Red, err.message));
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

	if (!user.value.username) {
		alert('Username cannot be empty', PopupColor.Red, 'Please type in a new username');
		return;
	}

	Api.users
		.edit(user.value)
		.then(() => {
			alert('User saved', PopupColor.Green, 'User was saved successfully');
			user.value.id === appState.user.id && Api.auth.me().then((u) => appState.setUser(u));
		})
		.catch((err) => alert('Could not save the user', PopupColor.Red, err.message));
}

async function deleteUser() {
	if (appState.user.username === user.value.username) {
		if (
			!(await confirm(
				'You are about to delete your account!',
				PopupColor.Red,
				'Be careful! You are going to delete your account and ' +
					'you might not be able to log back in if you proceed. ' +
					'Are you sure this is what you intended to do and you want to continue?'
			))
		)
			return;
	} else {
		if (
			!(await confirm(
				'Delete this user?',
				PopupColor.Red,
				'Are you sure you want to delete ' + user.value.username + '?'
			))
		)
			return;
	}

	Api.users
		.delete(user.value)
		.then(() =>
			router
				.push({name: 'users'})
				.catch((err) => alert('Could not delete the user', PopupColor.Red, err.message))
		);
}
</script>

<style scoped>
input[type='checkbox'] {
	@apply mr-4;
}
</style>
