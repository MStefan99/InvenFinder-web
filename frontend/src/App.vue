<template lang="pug">
NavBar
main
	Inventory(v-if="appState.activeTab === 'inventory'")
	Users(v-if="appState.activeTab === 'users'")
	Settings(v-if="appState.activeTab === 'settings'")
	ConnectionPopup
</template>

<script lang="ts">
import appState from './store.js';

import NavBar from './components/NavBar.vue';
import Inventory from './components/Inventory.vue';
import Users from './components/Users.vue';
import Settings from './components/Settings.vue';
import ConnectionPopup from './components/ConnectionPopup.vue';

export default {
	name: 'App',
	components: {
		ConnectionPopup,
		NavBar,
		Inventory,
		Users,
		Settings
	},
	data() {
		return {appState};
	}
};
</script>

<style></style>
