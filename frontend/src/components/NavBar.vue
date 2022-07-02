<template lang="pug">
nav.text-accent.font-semibold
	span
		RouterLink.clickable(:to="{name: 'inventory'}") Inventory
		RouterLink.clickable(:to="{name: 'users'}") Users
		RouterLink.clickable(:to="{name: 'settings'}") Settings
	span
		span.clickable(@click="appState.setConnectionDialogOpen(true)") Connection
		span.clickable(v-if="!appState.data.apiKey" @click="appState.setConnectionDialogOpen(true)") Sign in
		span.clickable(v-else @click="Api.logout") Sign out
</template>

<script setup lang="ts">
import {appState} from '../scripts/store.ts';
import Api from '../scripts/api.ts';
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
	@apply border-2 border-accent rounded-xl w-full p-2 my-3 shadow;
}

input[type='submit'] {
	@apply bg-accent font-bold text-background text-xl shadow-md;
}
</style>
