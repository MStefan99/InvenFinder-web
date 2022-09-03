<template lang="pug">
#users
	h2.text-accent.text-2xl.mb-4 Users
	#users-table
		RouterLink.list-item(
			v-for="user in users"
			:key="user.id"
			:to="{name: 'user', params: {id: user.id}}")
			p {{user.username}}
	button.mt-4(@click="newUser = defaultUser") Add a new user
	Transition(name="popup")
		.popup-wrapper(v-if="newUser !== null" @click.self="newUser = null")
			form.popup(@submit.prevent="addUser")
				p.text-2xl.mb-4 New item
				label.mb-2(for="name-input") Username
				input#username-input.mb-4.full(v-model="newUser.username" type="text" placeholder="user")
				label.mb-2(for="desc-input") Password
				input#password-input.mb-4.full(
					v-model="newUser.password"
					type="password"
					placeholder="password")
				label.mb-2 Permissions
				PermissionSelector.mb-4(v-model="newUser.permissions")
				button(type="submit") Add user
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

import type {User, NewUser} from '../scripts/types';
import PermissionSelector from '../components/PermissionSelector.vue';
import Api, {UserAPI} from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import {alert, PopupColor} from '../scripts/popups';

const users = ref<User[]>();
const newUser = ref<NewUser | null>(null);
const defaultUser = {username: '', password: '', permissions: 0} as NewUser;

function addUser() {
	Api.users.add(newUser.value).then((u) => {
		users.value.push(u);
		newUser.value = null;
	});
}

onMounted(() => {
	if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
		alert('Not allowed', PopupColor.Red, 'You do not have permissions to view this page');
		return;
	}

	UserAPI.getAll().then((u) => (users.value = u));
});
</script>

<style scoped></style>
