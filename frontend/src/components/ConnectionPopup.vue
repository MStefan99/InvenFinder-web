<template lang="pug">
Transition(name="popup")
	.popup-wrapper(v-if="!state.connected")
		.popup
			p.text-red-500.text-2xl Connection failed
			p Please check your connection settings
			.flex.items-center.mt-2
				span.mr-2 URL:
				input(type="text" v-model="state.url")
			.flex.justify-between.items-center
				button.font-bold(@click="checkConnection") Check connection
				span {{state.checking ? 'Checking connection...' : 'Connection failed'}}
</template>

<script lang="ts">
import appState from '../store.js';

export default {
	name: 'ConnectionPopup',
	data() {
		return {
			appState,
			state: {
				url: appState.backendURL,
				checking: false,
				connected: true
			}
		};
	},
	mounted() {
		this.checkConnection();
	},
	methods: {
		checkConnection() {
			if (!this.state.url) {
				this.state.connected = false;
				return;
			}

			this.state.checking = true;
			const c = new AbortController();
			const fetchPromise = fetch(this.state.url + '/api', {
				signal: c.signal
			});

			const t = setTimeout(() => {
				c.abort();
				this.state.connected = false;
				this.state.checking = false;
			}, 2500);

			fetchPromise
				.then((res) => {
					this.state.connected = res.ok;
					this.state.checking = false;
					localStorage.setItem('backendURL', this.state.url);
					clearTimeout(t);
				})
				.catch(() => {
					this.state.connected = false;
					this.state.checking = false;
				});
		}
	}
};
</script>

<style scoped>
input {
	@apply w-full border-teal-500 border-2 rounded-2xl p-2;
}

button {
	@apply bg-teal-500 rounded-xl text-white p-2 my-2;
}
</style>
