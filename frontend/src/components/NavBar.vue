<template lang="pug">
nav.text-teal-700.font-semibold
	span
		RouterLink.clickable(:to="{name: 'inventory'}") Inventory
		RouterLink.clickable(:to="{name: 'users'}") Users
		RouterLink.clickable(:to="{name: 'settings'}") Settings
	span
		span.clickable(@click="appState.setConnectionDialogOpen(true)") Connection
		span.clickable(v-if="!appState.data.apiKey" @click="openConnectionDialog") Sign in
		span.clickable(v-else @click="logout") Sign out
</template>

<script lang="ts">
import {appState, Tab} from '../scripts/store';
import Api from '../scripts/api';

export default {
	name: 'NavBar',
	data() {
		return {
			appState,
			Tab
		};
	},
	methods: {
		openConnectionDialog() {
			this.appState.setConnectionDialogOpen(true);
		},
		logout() {
			Api.logout();
		}
	}
};
</script>

<style scoped>
nav {
	position: sticky;
	top: 0;
	padding: 1em 1.5em;
	display: flex;
	flex-flow: row nowrap;
	justify-content: space-between;
	backdrop-filter: blur(1em);
	border-radius: 0 0 1em 1em;
	@apply shadow-neutral-300/10 shadow-xl;
}

nav .clickable {
	cursor: pointer;
}

nav .clickable:not(:last-child) {
	@apply mr-4;
}

label {
	display: block;
}

input {
	@apply border-2 border-teal-500 rounded-xl w-full p-2 my-3 shadow;
}

input[type='submit'] {
	@apply bg-teal-500 font-bold text-white text-xl shadow-md;
}
</style>
