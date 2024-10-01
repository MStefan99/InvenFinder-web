<template lang="pug">
#settings
	h2.text-accent.text-2xl.mb-4 Settings
	.mb-2
		span You are logged in as
			|
			|
			b {{appState.user.username}}
	form(@submit.prevent="updatePassword()")
		input(v-model="updateUser.username" autocomplete="username" placeholder="new-username")
		label(for="password-input") Password
		input#password-input.block.my-2(
			type="password"
			v-model="updateUser.password"
			autocomplete="new-password"
			placeholder="new-password")
		label(for="password-repeat-input") Repeat password
		input#password-repeat-input.block.my-2(
			type="password"
			v-model="passwordRepeat"
			autocomplete="new-password"
			placeholder="new-password")
		p.mb-2.text-red(v-if="(updateUser.password ?? '') !== passwordRepeat") Passwords do not match
		button(type="submit" :disabled="!formValid") Save
	.sessions.mb-4
		h3.text-accent.text-xl.my-4 Active sessions
		table.w-full
			thead
				tr
					th Address
					th Device
					th First used
			tbody
				tr(v-for="session in sessions" :key="session.token")
					td {{session.ip}}
					td {{parseUA(session.ua)}}
					td {{new Date(session.time).toLocaleString()}}
					td
						button(@click="logout(session)") Sign out
	.row
		button(@click="logoutAll()") Sign out everywhere
		button.red(v-if="appState.features.accounts" @click="deleteAccount()") Delete account
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';

import appState from '../scripts/store';
import Api from '../scripts/api';
import type {Session, UpdateUser} from '../scripts/types';
import {alert, PopupColor, confirm} from '../scripts/popups';

const sessions = ref<Session[]>([]);
const updateUser = ref<UpdateUser>({id: appState.user.id, password: ''});
const passwordRepeat = ref<string>('');
const formValid = computed<boolean>(
	() =>
		updateUser.value.password === passwordRepeat.value &&
		!!(updateUser.value.username?.length || updateUser.value.password?.length)
);

window.document.title = 'Settings | Invenfinder';

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
	if (!formValid.value) {
		alert(
			'Passwords do not match',
			PopupColor.Red,
			'Please check that both passwords are the same'
		);
		return;
	}

	Api.auth
		.edit(updateUser.value)
		.then(() => {
			alert(
				'Information changed',
				PopupColor.Green,
				'Your user info was successfully changed. Consider signing out your active sessions'
			);
			appState.user.username = updateUser.value.username;
			updateUser.value.username = updateUser.value.password = passwordRepeat.value = '';
		})
		.catch((err) => alert('Could not change your password', PopupColor.Red, err.message));
}

function logout(session: Session) {
	Api.sessions.logout(session.token);
	sessions.value.splice(sessions.value.indexOf(session), 1);
	if (session.token === appState.apiKey) {
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

async function deleteAccount() {
	if (
		!(await confirm(
			'Are you sure you want to delete your account?',
			PopupColor.Red,
			'All information associated with your user account will be deleted immediately'
		))
	) {
		return;
	}

	Api.auth
		.delete()
		.then(() =>
			alert(
				'Account deleted',
				PopupColor.Green,
				'Your account and all your information was deleted successfully'
			)
		)
		.catch((err) => alert('Could not delete account', PopupColor.Red, err.message));
}
</script>

<style scoped>
th {
	text-align: left;
}
</style>
