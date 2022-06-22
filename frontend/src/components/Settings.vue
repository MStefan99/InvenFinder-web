<template lang="pug">
#settings
	h2.text-teal-700.text-2xl.mb-4 Settings
	form(@submit.prevent)
		label(for="backend-url") Backend URL
		input#backend-url(type="text" v-model="appState.backendURL" @input="setURL")
	button(@click="testConnection") Test connection
	p {{getConnectionStatus()}}
</template>

<script>
import appState from '../store.js';

export default {
	name: 'Settings',
	data() {
		return {
			appState,
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
				.then((res) => (this.state.connected = res.ok))
				.catch(() => (this.state.connected = false));
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

<style scoped></style>
