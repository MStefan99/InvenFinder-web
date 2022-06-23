<template lang="pug">
NavBar
main
	RouterView
	ConnectionDialog
</template>

<script lang="ts">
import {appState, Tab} from './scripts/store';

import NavBar from './components/NavBar.vue';
import Inventory from './views/InventoryView.vue';
import Users from './views/UsersView.vue';
import Settings from './views/SettingsView.vue';
import ConnectionDialog from './components/ConnectionDialog.vue';

export default {
	name: 'App',
	components: {
		ConnectionDialog,
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
