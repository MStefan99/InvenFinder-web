<template lang="pug">
#user
	h2.text-accent.text-2xl.mb-4 User
	p {{user?.username}}
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {User} from '../scripts/types';
import {useRoute} from 'vue-router';
import {UserAPI} from '../scripts/api';
import appState from '../scripts/store';
import {PERMISSIONS} from '../../../common/permissions';
import {alert, PopupType} from '../scripts/popups';

const user = ref<User | null>(null);
const route = useRoute();

if (Array.isArray(route.params.username)) {
	throw new Error('Username parameter must not be an array');
}

if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
	console.log('not allowed');
	alert('Not allowed', PopupType.Warning, 'You do not have permissions to view this page');
}

UserAPI.getByUsername(route.params.username).then((u) => (user.value = u));
</script>

<style scoped></style>
