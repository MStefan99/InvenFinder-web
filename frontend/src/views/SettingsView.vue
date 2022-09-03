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
		button(type="submit") Save
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
			button(@click="Api.sessions.logoutAll") Sign out everywhere
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

import appState from '../scripts/store';
import Api from '../scripts/api';
import type {Session, UpdateUser} from '../scripts/types';
import {alert, PopupColor} from '../scripts/popups';

const sessions = ref<Session[]>([]);
const updateUser = ref<UpdateUser>({id: appState.user.id});
const passwordRepeat = ref<string>('');

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
	if (!updateUser.value.password.length) {
		return;
	}

	if (updateUser.value.password !== passwordRepeat.value) {
		alert('Passwords do not match', PopupColor.Red);
		return;
	}

	Api.auth
		.edit(updateUser.value)
		.then(() =>
			alert(
				'Saved',
				PopupColor.Green,
				'Your password was successfully changed. ' + 'Consider signing out your active sessions'
			)
		);
}

function logout(session: Session) {
	sessions.value.splice(sessions.value.indexOf(session), 1);
	Api.sessions.logout(session.id);
}

onMounted(() => Api.sessions.getAll().then((s) => (sessions.value = s)));
</script>

<style scoped>
th {
	text-align: left;
}
</style>
