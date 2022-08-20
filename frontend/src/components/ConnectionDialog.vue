<template lang="pug">
.popup-wrapper(@click.self="$emit('close')")
	.popup
		.mb-4(v-if="state.connection !== ConnectionState.AUTHENTICATED")
			p.text-red-500.text-2xl You are not signed in
			p Please check your connection settings below
		.mb-4(v-else)
			p.text-accent.text-2xl You are signed in!
			p You can change your connection settings here
		.mb-3
			label(for="url-input") URL
			input#url-input.full(v-model="state.url" type="text" placeholder="https://example.com")
		.mb-3
			button.full(
				type="button"
				:disabled="state.connection === ConnectionState.TESTING"
				@click="connect") Connect
		div(v-if="state.connection === ConnectionState.CONNECTED")
			.mb-3
				label(for="username-input") Username
				input#username-input.full(v-model="state.username" type="text" placeholder="user")
			.mb-3
				label(for="password-input") Password
				input#password-input.full(v-model="state.password" type="password" placeholder="password")
			.mb-3
				button.full(
					type="button"
					:disabled="state.connection === ConnectionState.TESTING"
					@click="login") Sign in
		div(v-if="state.connection === ConnectionState.AUTHENTICATED")
			button.full.mb-3(type="button" @click="logout") Sign out
		span.text-gray-500 {{getAuthenticationState()}}
</template>

<script setup lang="ts">
import {onMounted, reactive} from 'vue';

import appState from '../scripts/store';
import Api from '../scripts/api';

enum ConnectionState {
	TESTING,
	NOT_CONNECTED,
	CONNECTED,
	AUTHENTICATED
}

const state = reactive<{
	url: string;
	username: string;
	password: string;
	connection: ConnectionState;
}>({
	url: appState.backendURL,
	username: '',
	password: '',
	connection: ConnectionState.TESTING
});

onMounted(checkConnection);

function checkConnection() {
	state.connection = ConnectionState.TESTING;

	Api.auth
		.me()
		.then(() => {
			state.connection = ConnectionState.AUTHENTICATED;
		})
		.catch(() =>
			Api.connection
				.test()
				.then(
					(connected) =>
						(state.connection = connected
							? ConnectionState.CONNECTED
							: ConnectionState.NOT_CONNECTED)
				)
				.catch(() => (state.connection = ConnectionState.NOT_CONNECTED))
		);
}

function getAuthenticationState() {
	if (state.connection === ConnectionState.TESTING) {
		return 'Testing connection...';
	} else if (state.connection === ConnectionState.NOT_CONNECTED) {
		return 'Connection failed';
	} else if (state.connection === ConnectionState.CONNECTED) {
		return 'Connected but not signed in';
	} else if (state.connection === ConnectionState.AUTHENTICATED) {
		return 'Signed in! Click outside this window to close';
	}
}

function connect() {
	if (state.url === appState.backendURL) {
		return;
	}

	state.connection = ConnectionState.TESTING;
	Api.connection
		.testURL(state.url)
		.then((connected) => {
			if (connected) {
				state.connection = ConnectionState.CONNECTED;
				appState.setUrl(state.url);
			} else {
				state.connection = ConnectionState.NOT_CONNECTED;
			}
		})
		.catch(() => (state.connection = ConnectionState.NOT_CONNECTED));
}

function login() {
	state.connection = ConnectionState.TESTING;

	Api.auth
		.login(state.username, state.password)
		.then(() => (state.connection = ConnectionState.AUTHENTICATED))
		.catch(() => (state.connection = ConnectionState.CONNECTED));
}

function logout() {
	state.connection = ConnectionState.CONNECTED;

	Api.auth.logout();
}
</script>

<style scoped>
label {
	@apply block mb-2;
}
</style>
