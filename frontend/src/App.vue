<template lang="pug">
NavBar
main
	Inventory(v-if="store.activeTab === 'inventory'")
	Users(v-if="store.activeTab === 'users'")
	Settings(v-if="store.activeTab === 'settings'")
	ConnectionPopup(v-if="!connected")
</template>

<script lang="ts">
import store from './store.js';

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
		return {store, connected: true};
	},
	beforeMount() {
		store.apiKey = localStorage.getItem('apiKey');
		store.backendURL = localStorage.getItem('backendURL');
		if (!localStorage.getItem('backendURL')) {
			this.connected = false;
		} else {
			const baseURL = localStorage.getItem('backendURL');
			const c = new AbortController();

			const fetchPromise = fetch(baseURL + '/api', {
				signal: c.signal
			});

			setTimeout(() => {
				c.abort();
				this.connected = false;
			}, 2500);

			fetchPromise.then((res) => (this.connected = res.ok)).catch(() => (this.connected = false));
		}
	}
};
</script>

<style lang="sass">
@import "assets/tw.css"


*, *::before, *::after
  box-sizing: border-box

body
  font-family: sans-serif
  margin: 0

a
  text-decoration: none
  color: inherit

main
  padding: 2em
</style>
