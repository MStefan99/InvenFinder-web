<template lang="pug">
header.no-print
	NavBar

main
	RouterView(v-if="appState.user")
	div(v-else)
		p.text-red-500.text-xl Please sign in to use the app

footer
	.print
		p.text-muted Do not edit, this file was generated automatically by InvenFinder
</template>

<script setup lang="ts">
import {onMounted} from 'vue';

import NavBar from './components/NavBar.vue';
import Api from './scripts/api.ts';
import appState from './scripts/store.ts';

onMounted(checkConnection);

function checkConnection() {
	Api.auth
		.me()
		.then((user) => {
			appState.setUser(user);
		})
		.catch(() => null);
}
</script>

<style></style>
