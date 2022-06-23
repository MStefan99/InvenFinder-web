<template lang="pug">
NavBar
main
	Inventory(v-if="appState.activeTab === Tab.Inventory")
	Users(v-if="appState.activeTab === Tab.Users")
	Settings(v-if="appState.activeTab === Tab.Settings")
	ConnectionPopup
</template>

<script lang="ts">
import {appState, Tab} from './scripts/store';

import NavBar from './components/NavBar.vue';
import Inventory from './views/InventoryView.vue';
import Users from './views/UsersView.vue';
import Settings from './views/SettingsView.vue';
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
