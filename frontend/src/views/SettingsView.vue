<template lang="pug">
#settings
	h2.text-accent.text-2xl.mb-4 Settings
	span.mr-2 You are logged in as:
	b {{appState.user.username}}
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
			button(@click="Api.auth.logoutAll") Sign out everywhere
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

import appState from '../scripts/store';
import Api from '../scripts/api';
import {Session} from '../scripts/types';

const sessions = ref<Session[]>([]);

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

function logout(session: Session) {
	sessions.value.splice(sessions.value.indexOf(session), 1);
	Api.sessions.logout(session.id);
}

onMounted(() => {
	Api.sessions.getAll().then((s) => (sessions.value = s));
});
</script>

<style scoped>
th {
	text-align: left;
}
</style>
