<template lang="pug">
h2 Settings
button(@click="testConnection") Test connection
p {{privateState.connected}}
</template>


<script>
import store from '../store.js';


export default {
	name: 'Settings',
	data() {
		return {
			sharedState: store,
			privateState: {
				connected: false
			}
		};
	},
	methods: {
		testConnection() {
			fetch(this.sharedState.backendURL)
				.then(res => this.privateState.connected = res.ok)
				.catch(err => this.privateState.connected = false);
		}
	}
};
</script>


<style lang="stylus" scoped>
h2
	color var(--color-accent)
</style>
