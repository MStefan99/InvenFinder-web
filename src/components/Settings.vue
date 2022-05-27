<template lang="pug">
div#settings
	h2 Settings
	form(@submit.prevent)
		label(for="backend-url") Backend URL
		input#backend-url(type="text", v-model="appState.backendURL" @input="setURL")
	button(@click="testConnection") Test connection
	p {{getConnectionStatus()}}
</template>


<script>
import store from '../store.js';


export default {
	name: 'Settings',
	data() {
		return {
			appState: store,
			state: {
				connected: null
			}
		};
	},
	methods: {
		setURL() {
			localStorage.setItem('backendURL', this.appState.backendURL);
		},
		testConnection() {
			this.state.connected = null;

			fetch(this.appState.backendURL)
				.then(res => this.state.connected = res.ok)
				.catch(err => this.state.connected = false);
		},
		getConnectionStatus() {
			if (this.state.connected === null) {
				return 'Test connection';
			} else if (this.state.connected) {
				return 'Connection succeeded';
			} else {
				return 'Connection failed';
			}
		}
	}
};
</script>


<style lang="stylus" scoped>
h2
	color var(--color-accent)
</style>
