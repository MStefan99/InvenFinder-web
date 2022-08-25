<template lang="pug">
#user
	h2.text-accent.text-2xl.mb-4 User
	.mb-6
		p {{user?.username}}
	h3.text-accent.text-lg.mb-4 Permissions
	form.permissions(@submit.prevent="save")
		div
			input(type="checkbox" v-model="permissions[0]" :true-value="0" :false-value="undefined")
			label Store and retrieve items
		div
			input(type="checkbox" v-model="permissions[1]" :true-value="1" :false-value="undefined")
			label Edit, add and remove items
		.mb-2
			input(type="checkbox" v-model="permissions[2]" :true-value="2" :false-value="undefined")
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
import {alert, confirm, PopupType} from '../scripts/popups';

const user = ref<User | null>(null);
const route = useRoute();

const permissions = ref<PERMISSIONS[]>(parsePermissions(appState.user.permissions));

if (Array.isArray(route.params.username)) {
	throw new Error('Username parameter must not be an array');
}

if (!appState.hasPermissions([PERMISSIONS.MANAGE_USERS])) {
	alert('Not allowed', PopupType.Warning, 'You do not have permissions to view this page');
}

UserAPI.getByUsername(route.params.username).then((u) => (user.value = u));

async function save() {
	if (
		user.value.id === appState.user.id &&
		!hasPermissions(user.value.permissions, permissions.value) &&
		!(await confirm(
			'You are about to lose permissions!',
			PopupType.Warning,
			'Be careful! You are going to revoke permissions from yourself and ' +
				'you might not be able to regain them if you choose to proceed. ' +
				'Are you sure this is what you intend to do and do you want to continue?'
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
