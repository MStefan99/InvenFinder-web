<template lang="pug">
#settings
	h2.text-accent.text-2xl.mb-4 Settings
	.mb-2
		span You are logged in as
			|
			|
			b {{appState.user.username}}
	form(@submit.prevent="updatePassword")
		input(:value="appState.user.username" hidden autocomplete="username")
		label(for="password-input") Password
		input#password-input.block.my-2(
			type="password"
			v-model="updateUser.password"
			autocomplete="new-password")
		label(for="password-repeat-input") Repeat password
		input#password-repeat-input.block.my-2(
			type="password"
			v-model="passwordRepeat"
			autocomplete="new-password")
		p.mb-2.text-red(v-if="updateUser.password?.length || passwordRepeat.length") Passwords do not match
		button(type="submit" :disabled="!passwordsMatch") Save
	.sessions
		p.text-xl.my-4 Active sessions
		table.w-full
			thead
				tr
					th Location
					th Device
					th Created at
			tbody
				tr(v-for="session in sessions" :key="session.id")
					td {{session.ip}}
					td {{parseUA(session.ua)}}
					td {{new Date(session.time).toLocaleString()}}
					td
						button(@click="logout(session)") Sign out
			button(@click="logoutAll") Sign out everywhere
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';

import appState from '../scripts/store';
import Api from '../scripts/api';
import type {Session, UpdateUser} from '../scripts/types';
import {alert, PopupColor} from '../scripts/popups';

const sessions = ref<Session[]>([]);
const updateUser = ref<UpdateUser>({id: appState.user.id});
const passwordRepeat = ref<string>('');
const passwordsMatch = computed<boolean>(
	() =>
		updateUser.value.password?.length &&
		passwordRepeat.value.length &&
		updateUser.value.password === passwordRepeat.value
);

function parseUA(ua: string): string | null {
	const res = ua.match(/.*? \((.*?); (.*?)([;)]).*/);
	let os: string | null;

	if (!res) os = ua ?? null;
	else if (res[1] === 'Linux') os = res[2] ?? null;
	else if (res[2] === 'Win64') os = res[1]?.replace('NT ', '')?.replace('.0', '') ?? null;
	else if (res[1] === 'Macintosh')
		os = 'macOS ' + res[2]?.replace(/.*Mac OS X (.*?)$/, '$1')?.replace(/_/g, '.') ?? null;
	else if (res[1] === 'iPhone')
		os = 'iPhone (iOS ' + res[2]?.replace(/.*OS (.*?) like.*/, '$1)')?.replace(/_/g, '.') ?? null;
	else if (res[1] === 'iPad')
		os = 'iPad (iPadOS ' + res[2]?.replace(/.*OS (.*?) like.*/, '$1)')?.replace(/_/g, '.') ?? null;
	else os = res[1] ?? null;

	return os;
}

function updatePassword() {
	if (!updateUser.value.password?.length || passwordRepeat.value.length) {
		alert('Password cannot be empty', PopupColor.Red, 'Please type in a new password');
		return;
	}

	if (!passwordsMatch.value) {
		alert(
			'Passwords do not match',
			PopupColor.Red,
			'Please check that both passwords are the same'
		);
		return;
	}

	Api.auth
		.edit(updateUser.value)
		.then(() =>
			alert(
				'Password changed',
				PopupColor.Green,
				'Your password was successfully changed. Consider signing out your active sessions'
			)
		)
		.catch((err) => alert('Could not change your password', PopupColor.Red, err.message));
}

function logout(session: Session) {
	Api.sessions.logout(session.id);
	sessions.value.splice(sessions.value.indexOf(session), 1);
	if (session.id === appState.apiKey) {
		appState.setApiKey(null);
		appState.setUser(null);
	}
}

function logoutAll() {
	Api.sessions.logoutAll();
	appState.setApiKey(null);
	appState.setUser(null);
}

onMounted(() =>
	Api.sessions
		.getAll()
		.then((s) => (sessions.value = s))
		.catch((err) => alert('Could not load sessions', PopupColor.Red, err.message))
);
</script>

<style scoped>
th {
	text-align: left;
}
</style>
