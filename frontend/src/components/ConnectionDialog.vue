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
		div(v-if="state.connection === ConnectionState.NOT_AUTHENTICATED")
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
		span.text-gray-500 {{getAuthenticationState()}}
</template>

<script setup lang="ts">
import {onMounted, reactive} from 'vue';

import appState from '../scripts/store.ts';
import Api from '../scripts/api.ts';

enum ConnectionState {
	NOT_TESTED,
	NOT_CONNECTED,
	NOT_AUTHENTICATED,
	AUTHENTICATED,
	TESTING
}

const state = reactive<{
	url: string;
	username: string;
	password: string;
	connection: ConnectionState;
}>({
	url: appState.data.backendURL,
	username: '',
	password: '',
	connection: ConnectionState.NOT_TESTED
});

onMounted(checkConnection);

function checkConnection() {
	state.connection = ConnectionState.TESTING;

	Api.me().then((user) => {
		if (user !== null) {
			state.connection = ConnectionState.AUTHENTICATED;
		} else {
			Api.test().then((connected) => {
				state.connection = connected
					? ConnectionState.NOT_AUTHENTICATED
					: ConnectionState.NOT_CONNECTED;
			});
		}
	});
}

function getAuthenticationState() {
	if (state.connection === ConnectionState.NOT_TESTED) {
		return '';
	} else if (state.connection === ConnectionState.TESTING) {
		return 'Testing connection...';
	} else if (state.connection === ConnectionState.NOT_CONNECTED) {
		return 'Connection failed';
	} else if (state.connection === ConnectionState.NOT_AUTHENTICATED) {
		return 'Connected but not signed in';
	} else if (state.connection === ConnectionState.AUTHENTICATED) {
		return 'Signed in! Click outside this window to close';
	}
}

function connect() {
	if (state.url === appState.data.backendURL) {
		return;
	}

	state.connection = ConnectionState.TESTING;
	Api.testURL(state.url).then((connected) => {
		state.connection = connected
			? ConnectionState.NOT_AUTHENTICATED
			: ConnectionState.NOT_CONNECTED;

		if (connected) {
			appState.setUrl(state.url);
		}
	});
}

function login() {
	state.connection = ConnectionState.TESTING;

	Api.login(state.username, state.password).then((auth) => {
		state.connection =
			auth !== null ? ConnectionState.AUTHENTICATED : ConnectionState.NOT_AUTHENTICATED;
	});
}
</script>

<style scoped>
label {
	@apply block mb-2;
}
</style>
