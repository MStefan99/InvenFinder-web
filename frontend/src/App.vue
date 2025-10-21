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
	span.clickable(v-if="appState.crashCourse" @click="sendFeedback()") Send feedback
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import PopupContainer from './components/PopupContainer.vue';
import appState from './scripts/store';
import { PopupColor, alert, prompt } from './scripts/popups';

function sendFeedback(): void {
  prompt(
    'Send feedback',
    PopupColor.Accent,
    'Your feedback helps make Invenfinder better. Please type your message in the field below.',
  )
    .then((message) =>
      appState.crashCourse?.sendFeedback(message).then((err) => {
        if (err) {
          alert(
            'Feedback was not sent',
            PopupColor.Red,
            err?.message || 'Failed to send feedback. Please check your connection and try again.',
          );
        } else {
          alert(
            'Feedback sent',
            PopupColor.Green,
            'Thank you! All feedback helps make Invenfinder better.',
          );
        }
      }),
    )
    .catch((): null => null);
}
</script>

<style></style>
