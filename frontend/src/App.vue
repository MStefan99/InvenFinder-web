<template lang="pug">
NavBar
main
	Inventory(v-if="store.activeTab === 'inventory'")
	Users(v-if="store.activeTab === 'users'")
	Settings(v-if="store.activeTab === 'settings'")
</template>


<script>
import store from './store.js';

import NavBar from './components/NavBar.vue';
import Inventory from './components/Inventory.vue';
import Users from './components/Users.vue';
import Settings from './components/Settings.vue';


export default {
	name: 'App',
	components: {
		NavBar,
		Inventory,
		Users,
		Settings
	},
	data() {
		return {store};
	},
	beforeMount() {
		store.apiKey = localStorage.getItem('apiKey');
		store.backendURL = localStorage.getItem('backendURL');
	}
};
</script>


<style lang="sass">
@tailwind base
@tailwind components
@tailwind utilities


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
