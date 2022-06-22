<template lang="pug">
NavBar
main
	Inventory(v-if="appState.activeTab === Tab.Inventory")
	Users(v-if="appState.activeTab === Tab.Users")
	Settings(v-if="appState.activeTab === Tab.Settings")
	ConnectionPopup
</template>

<script lang="ts">
import {appState, Tab} from './store.js';

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
		return {
			appState,
			Tab
		};
	}
};
</script>

<style></style>
