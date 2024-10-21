<template lang="pug">
.popup-wrapper(@click.self="$emit('close')")
	.popup
		p.text-2xl.mb-4.font-semibold Sign in
		form(@submit.prevent="connect()")
			.backend(v-if="!envBackendURL")
				.mb-3
					label(for="url-input") URL
					input#url-input.w-full(v-model="url" type="text" placeholder="https://example.com")
				.mb-3
					button.w-full(type="submit" :disabled="connectionState === ConnectionState.TESTING") Connect
		form(v-if="connectionState === ConnectionState.CONNECTED" @submit.prevent="login()")
			.mb-3
				label(for="username-input") Username
				input#username-input.w-full(
					v-model="username"
					type="text"
					placeholder="user"
					autocomplete="username")
			.mb-3
				label(for="password-input") Password
				input#password-input.w-full(
					v-model="password"
					type="password"
					placeholder="password"
					autocomplete="current-password")
			.mb-3.row.w-full
				button(type="submit" :disabled="connectionState === ConnectionState.TESTING") Sign in
				button(
					v-if="appState.features.accounts"
					type="button"
					:disabled="connectionState === ConnectionState.TESTING"
					@click="register()") Sign up
			template(v-if="appState.ssoProviders?.size")
				label Single sign-on
				.mb-3.row.w-full
					button(
						v-for="sso in appState.ssoProviders.values()"
						:key="sso.client_id"
						type="button"
						:disabled="connectionState === ConnectionState.TESTING"
						@click="ssoLogin(sso.name)") Sign in with {{sso.name}}
			p.text-red(v-if="authError") {{authError}}
		span.text-muted {{getAuthenticationState()}}
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

import {login as ssoLogin} from '../scripts/sso';

import appState from '../scripts/store';
import Api from '../scripts/api';

const emit = defineEmits<{(e: 'close'): void}>();

enum ConnectionState {
	TESTING,
	NOT_CONNECTED,
	CONNECTED,
	AUTHENTICATED
}

const url = ref<string | null>(appState.backendURL);
const username = ref<string>('');
const password = ref<string>('');
const connectionState = ref<ConnectionState>(ConnectionState.TESTING);
const authError = ref<string>('');

onMounted(checkConnection);

function checkConnection() {
	connectionState.value = ConnectionState.TESTING;

	Api.auth
		.me()
		.then(() => {
			connectionState.value = ConnectionState.AUTHENTICATED;
		})
		.catch(() =>
			Api.connection
				.test()
				.then(
					(connected) =>
						(connectionState.value = connected
							? ConnectionState.CONNECTED
							: ConnectionState.NOT_CONNECTED)
				)
				.catch(() => (connectionState.value = ConnectionState.NOT_CONNECTED))
		);
}

function getAuthenticationState() {
	if (connectionState.value === ConnectionState.TESTING) {
		return 'Testing connection...';
	} else if (connectionState.value === ConnectionState.NOT_CONNECTED) {
		return 'Connection failed';
	} else if (connectionState.value === ConnectionState.CONNECTED) {
		return 'Connected but not signed in';
	} else if (connectionState.value === ConnectionState.AUTHENTICATED) {
		return 'Signed in! Click outside this window to close';
	}
}

function connect() {
	connectionState.value = ConnectionState.TESTING;

	Api.connection
		.testURL(url.value)
		.then((connected) => {
			if (connected) {
				connectionState.value = ConnectionState.CONNECTED;
				appState.setUrl(url.value);
			} else {
				connectionState.value = ConnectionState.NOT_CONNECTED;
			}
		})
		.catch(() => (connectionState.value = ConnectionState.NOT_CONNECTED));
}

function login() {
	connectionState.value = ConnectionState.TESTING;

	Api.auth
		.login(username.value, password.value)
		.then(() => {
			connectionState.value = ConnectionState.AUTHENTICATED;
			emit('close');
		})
		.catch((err) => {
			connectionState.value = ConnectionState.CONNECTED;
			authError.value = err.message;
		});
}

function register() {
	connectionState.value = ConnectionState.TESTING;

	Api.auth
		.register(username.value, password.value)
		.then(() => {
			connectionState.value = ConnectionState.AUTHENTICATED;
			emit('close');
		})
		.catch((err) => {
			connectionState.value = ConnectionState.CONNECTED;
			authError.value = err.message;
		});
}
</script>

<style scoped>
label {
	@apply block mb-2;
}
</style>
