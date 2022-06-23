<template lang="pug">
nav.text-teal-700.font-semibold
	span
		span.clickable.mr-2(@click="appState.openTab(Tab.Inventory)") Inventory
		span.clickable.mr-2(@click="appState.openTab(Tab.Users)") Users
		span.clickable.mr-2(@click="appState.openTab(Tab.Settings)") Settings
	span
		span.clickable.mr-2(v-if="!appState.data.apiKey" @click="openConnectionDialog") Sign in
		span.clickable.mr-2(v-else @click="logout") Sign out
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

nav:not(:last-child) {
	margin-right: 1.5em;
}

nav .clickable {
	cursor: pointer;
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
