<template lang="pug">
#users
	h2.text-accent.text-2xl.mb-4 Users
	#users-table
		RouterLink.list-item(
			v-for="user in users"
			:key="user.id"
			:to="{name: 'user', params: {username: user.username}}")
			p {{user.username}}
</template>

<script setup lang="ts">
import {ref} from 'vue';

import type {User} from '../scripts/types';
import {UserAPI} from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import {alert, PopupType} from '../scripts/popups';

const users = ref<User[]>();

if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
	console.log('not allowed');
	alert('Not allowed', PopupType.Warning, 'You do not have permissions to view this page');
}

UserAPI.getAll().then((u) => (users.value = u));
</script>

<style scoped></style>
