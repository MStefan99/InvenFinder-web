<template lang="pug">
#settings
	h2.text-teal-700.text-2xl.mb-4 Settings
	form(@submit.prevent)
		label(for="backend-url") Backend URL
		input#backend-url(type="text" v-model="appState.backendURL" @input="setURL")
	button(@click="testConnection") Save connection
	p {{getConnectionStatus()}}
</template>

<script lang="ts">
import appState from '../scripts/store';

export default {
	name: 'SettingsView',
	data() {
		return {
			appState,
			state: {
				connected: null
			}
		};
	},
	mounted() {
		this.testConnection();
	},
	methods: {
		setURL() {
			localStorage.setItem('backendURL', this.appState.backendURL);
		},
		testConnection() {
			this.state.connected = null;

			fetch(this.appState.backendURL + '/api')
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
