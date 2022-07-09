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
					th IP
					th User-Agent
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

import appState from '../scripts/store.ts';
import Api from '../scripts/api.ts';
import {Session} from '../scripts/types.ts';

const sessions = ref<Session[]>([]);

function parseUA(ua: string): string {
	const res = ua.match(/.*? \((.*?); (.*?)([;)]).*/);
	let os: string;

	if (!res) os = ua;
	else if (res[1] === 'Linux') os = res[2];
	else if (res[2] === 'Win64') os = res[1].replace('NT ', '').replace('.0', '');
	else if (res[1] === 'Macintosh')
		os = 'macOS ' + res[2].replace(/.*Mac OS X (.*?)$/, '$1').replace(/_/g, '.');
	else if (res[1] === 'iPhone')
		os = 'iPhone (iOS ' + res[2].replace(/.*OS (.*?) like.*/, '$1)').replace(/_/g, '.');
	else if (res[1] === 'iPad')
		os = 'iPad (iPadOS ' + res[2].replace(/.*OS (.*?) like.*/, '$1)').replace(/_/g, '.');
	else os = res[1];

	return os;
}

function logout(session: Session) {
	sessions.value.splice(sessions.value.indexOf(session), 1);
	Api.auth.logoutSession(session.id);
}

onMounted(() => {
	Api.auth.getSessions().then((s) => (sessions.value = s));
});
</script>

<style scoped>
th {
	text-align: left;
}
</style>
