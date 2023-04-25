<template lang="pug">
header.no-print
	NavBar

main.grow
	RouterView(v-if="appState.user")
	div(v-else)
		p.text-red.text-xl Please sign in to use the app
	PopupContainer

footer
	span Invenfinder
	.print
		p.text-muted Do not edit, this file was generated automatically by InvenFinder
	span.clickable(@click="sendFeedback()") Send feedback
</template>

<script setup lang="ts">
import {onMounted} from 'vue';

import NavBar from './components/NavBar.vue';
import PopupContainer from './components/PopupContainer.vue';
import Api from './scripts/api';
import appState from './scripts/store';
import {PopupColor, alert, prompt} from './scripts/popups';

onMounted(checkConnection);

function checkConnection() {
	Api.auth.me().then((user) => {
		appState.setUser(user);
	});
}

function sendFeedback() {
	prompt(
		'Send feedback',
		PopupColor.Accent,
		'Your feedback helps make InvenFinder better. Please type your message in the field below.'
	)
		.then((message) =>
			appState.crashCourse
				.sendFeedback(message)
				.then(() =>
					alert(
						'Feedback sent',
						PopupColor.Green,
						'Thank you! All feedback helps make InvenFinder better.'
					)
				)
				.catch(() =>
					alert(
						'Feedback was not sent',
						PopupColor.Red,
						'Failed to send feedback. Please check your connection and try again.'
					)
				)
		)
		.catch(() => null);
}
</script>

<style></style>
