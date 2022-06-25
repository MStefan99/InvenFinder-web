<template lang="pug">
Transition(name="popup")
	.popup-wrapper(
		v-if="appState.ui.connectionDialogOpen"
		@click.self="appState.setConnectionDialogOpen(false)")
		.popup
			.mb-4(v-if="!state.authenticated")
				p.text-red-500.text-2xl You are not signed in
				p Please check your connection settings
			.mb-4(v-else)
				p.text-2xl Connection settings
				p You can change your connection settings here
			.mb-3
				label(for="url-input") URL
				input#url-input(type="text" placeholder="https://example.com" v-model="state.url")
			.mb-3
				input(type="button" value="Connect" :disabled="state.checking" @click="connect")
			.mb-3
				label(for="username-input") Username
				input#username-input(type="text" placeholder="user" v-model="state.username")
			.mb-3
				label(for="password-input") Password
				input#password-input(type="password" placeholder="password" v-model="state.password")
			.mb-3
				input(
					type="button"
					value="Sign in"
					:disabled="state.checking || !state.connected || state.authenticated"
					@click="login")
				span.text-gray-500 {{getAuthenticationState()}}
</template>

<script lang="ts">
import appState from '../scripts/store';
import Api from '../scripts/api';

// TODO: reload on open (use watch on appState.connectionDialogOpen)
export default {
	name: 'ConnectionPopup',
	data() {
		return {
			appState,
			state: {
				url: appState.data.backendURL,
				username: '',
				password: '',
				checking: false,
				connected: false,
				authenticated: false
			}
		};
	},
	mounted() {
		Api.auth().then((authenticated) => {
			this.state.authenticated = authenticated;
			if (!authenticated) {
				Api.test().then((connected) => {
					this.state.connected = connected;
					appState.setConnectionDialogOpen(true);
				});
			}
		});
	},
	methods: {
		getAuthenticationState() {
			if (this.state.checking) {
				return 'Checking connection...';
			} else if (!this.state.connected) {
				return 'Connection failed';
			} else if (!this.state.authenticated) {
				return 'Connected but not signed in';
			} else {
				return 'Signed in!';
			}
		},
		checkConnection() {
			this.state.checking = true;

			Api.test().then((connected) => {
				this.state.checking = false;
				this.state.connected = connected;
			});
		},
		checkAuth() {
			this.state.checking = true;

			Api.auth().then((authenticated) => {
				this.state.checking = false;
				this.state.authenticated = authenticated;
			});
		},
		connect() {
			this.state.checking = true;

			Api.testURL(this.state.url).then((connected) => {
				this.state.checking = false;
				this.state.connected = connected;

				if (connected) {
					this.appState.setUrl(this.state.url);
				}
			});
		},
		login() {
			this.state.checking = true;

			Api.login(this.state.username, this.state.password).then((key) => {
				this.state.checking = false;
				this.state.authenticated = key !== null;

				if (key !== null) {
					this.appState.setApiKey(key);
				}
			});
		}
	}
};
</script>

<style scoped>
label {
	@apply block mb-2;
}

input {
	@apply w-full rounded-xl p-2;
	transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

input:not([type='button']) {
	@apply border-teal-500 border-2 shadow;
}

input[type='button'] {
	@apply text-white my-2 shadow-md;
}

input[type='button']:not([disabled]) {
	@apply bg-teal-500 cursor-pointer;
}

input[type='button'][disabled] {
	@apply bg-gray-300 cursor-not-allowed;
}
</style>
