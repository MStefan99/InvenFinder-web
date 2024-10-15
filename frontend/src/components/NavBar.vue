<template lang="pug">
div
	nav.text-accent.font-semibold
		span.pages
			span(v-if="appState.user")
				RouterLink.clickable(:to="{name: 'inventory'}") Inventory
				RouterLink.clickable(:to="{name: 'check'}") Check
				RouterLink.clickable(
					v-if="appState.features.loans && appState.hasPermissions([PERMISSIONS.LOAN_ITEMS])"
					:to="{name: 'loans'}") My loans
				RouterLink.clickable(
					v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS, PERMISSIONS.MANAGE_USERS], true)"
					:to="{name: 'users'}") Users
				RouterLink.clickable(:to="{name: 'settings'}") Settings
		span.account
			span.clickable(v-if="!appState.user" @click="connectionDialogOpen = true") Sign in
			span.clickable(v-else @click="Api.auth.logout()") Sign out
	Transition(name="popup")
		ConnectionDialog(v-if="connectionDialogOpen" @close="connectionDialogOpen = false")
</template>

<script setup lang="ts">
import {ref} from 'vue';

import {appState, settingsLoaded} from '../scripts/store';
import Api from '../scripts/api';
import {PERMISSIONS} from '../../../common/permissions';
import ConnectionDialog from './ConnectionDialog.vue';

const connectionDialogOpen = ref<boolean>(!appState.apiKey);

import {useRoute, useRouter} from 'vue-router';
import {getTokens} from '../scripts/sso';

const route = useRoute();
const router = useRouter();

router
	.isReady()
	.then(() => settingsLoaded)
	.then(async () => {
		if ('code' in route.query) {
			await getTokens();

			const query = Object.assign({}, route.query);
			delete query.code;
			await router.replace({query});
		}

		checkConnection();
	});

function checkConnection() {
	Api.auth
		.me()
		.then((user) => {
			connectionDialogOpen.value = false;
			appState.setUser(user);
		})
		.catch(() => {
			connectionDialogOpen.value = true;
		});
}
</script>

<style scoped>
label {
	display: block;
}

input {
	@apply border-2 border-accent rounded-xl w-full p-2 my-3 shadow;
}

input[type='submit'] {
	@apply bg-accent font-bold text-background text-xl shadow-md;
}
</style>
