<template lang="pug">
header.no-print
	NavBar

main.grow
	RouterView(v-if="appState.user")
	div(v-else)
		p.text-red.text-xl Please sign in to use the app
	PopupContainer

footer
	span Invenfinder
	.print
		p.text-muted Do not edit, this file was generated automatically by InvenFinder
</template>

<script setup lang="ts">
import {onMounted} from 'vue';

import NavBar from './components/NavBar.vue';
import PopupContainer from './components/PopupContainer.vue';
import Api from './scripts/api';
import appState from './scripts/store';

onMounted(checkConnection);

function checkConnection() {
	Api.auth.me().then((user) => {
		appState.setUser(user);
	});
}
</script>

<style></style>
