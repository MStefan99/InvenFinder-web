<template lang="pug">
div
	nav.text-accent.font-semibold
		span
			RouterLink.clickable(:to="{name: 'inventory'}") Inventory
			RouterLink.clickable(:to="{name: 'users'}") Users
			RouterLink.clickable(:to="{name: 'settings'}") Settings
		span
			span.clickable(@click="connectionDialogOpen = true") Connection
			span.clickable(v-if="!appState.apiKey" @click="connectionDialogOpen = true") Sign in
			span.clickable(v-else @click="logout") Sign out
	Transition(name="popup")
		ConnectionDialog(v-if="connectionDialogOpen" @close="connectionDialogOpen = false")
</template>

<script setup lang="ts">
import {ref} from 'vue';

import {appState} from '../scripts/store.ts';
import Api from '../scripts/api.ts';
import ConnectionDialog from './ConnectionDialog.vue';

const connectionDialogOpen = ref<boolean>(false);

function logout() {
	Api.logout();
	appState.setApiKey(null);
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
