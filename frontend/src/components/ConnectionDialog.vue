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
				p.text-accent.text-2xl You are signed in!
				p You can change your connection settings here
			.mb-3
				label(for="url-input") URL
				input#url-input.full(type="text" placeholder="https://example.com" v-model="state.url")
			.mb-3
				button.full(type="button" :disabled="state.checking" @click="connect") Connect
			div(v-if="state.connected && !state.authenticated")
				.mb-3
					label(for="username-input") Username
					input#username-input.full(type="text" placeholder="user" v-model="state.username")
				.mb-3
					label(for="password-input") Password
					input#password-input.full(type="password" placeholder="password" v-model="state.password")
				.mb-3
					button.full(type="button" :disabled="state.checking" @click="login") Sign in
			span.text-gray-500 {{getAuthenticationState()}}
</template>

<script setup lang="ts">
import appState from '../scripts/store.ts';
import Api from '../scripts/api.ts';
import {reactive, watch} from 'vue';

const state = reactive<{
	url: string;
	username: string;
	password: string;
	checking: boolean;
	connected: boolean;
	authenticated: boolean;
}>({
	url: appState.data.backendURL,
	username: '',
	password: '',
	checking: false,
	connected: false,
	authenticated: false
});

watch(
	() => appState.ui.connectionDialogOpen,
	() => {
		if (appState.ui.connectionDialogOpen) {
			checkConnection();
		}
	}
);

function checkConnection() {
	Api.me().then((user) => {
		state.authenticated = user !== null;
		state.connected = user !== null;

		appState.setUser(user);
		if (user === null) {
			Api.test().then((connected) => {
				state.connected = connected;
				appState.setConnectionDialogOpen(true);
			});
		}
	});
}

function getAuthenticationState() {
	if (state.checking) {
		return 'Checking connection...';
	} else if (!state.connected) {
		return 'Connection failed';
	} else if (!state.authenticated) {
		return 'Connected but not signed in';
	} else {
		return 'Signed in! Click outside this window to close';
	}
}

function connect() {
	state.checking = true;

	Api.testURL(state.url).then((connected) => {
		state.checking = false;
		state.connected = connected;

		if (connected) {
			appState.setUrl(state.url);
		}
	});
}

function login() {
	state.checking = true;

	Api.login(state.username, state.password).then((key) => {
		state.checking = false;
		state.authenticated = key !== null;

		if (key !== null) {
			appState.setApiKey(key);
		}
	});
}
</script>

<style scoped>
label {
	@apply block mb-2;
}
</style>
