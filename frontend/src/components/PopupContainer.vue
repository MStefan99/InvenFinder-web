<template lang="pug">
#popups
	#alerts
		TransitionGroup(name="popup" v-if="!activeConfirm && !activePrompt")
			.alert(v-for="alert in activeAlerts" :key="alert.title" :class="alert.type")
				.title {{alert.title}}
				.details {{alert.details}}
	Transition(name="popup")
		#confirm(v-if="activeConfirm" :class="activeConfirm.confirm.type")
			.title {{activeConfirm.confirm.title}}
			.details {{activeConfirm.confirm.details}}
			.mt-2
				button.mr-4(@click="resolveConfirm(true)") Yes
				button(@click="resolveConfirm(false)") No
	Transition(name="popup")
		#prompt(v-if="activePrompt" :class="activePrompt.prompt.type")
			.title {{activePrompt.prompt.title}}
			.details {{activePrompt.prompt.details}}
			form.mt-2(@submit.prevent="resolvePrompt()")
				input.mr-4(type="text" v-model="promptValue")
				button(type="submit") Submit
</template>

<script setup lang="ts">
import {activeAlerts, activeConfirm, activePrompt} from '../scripts/popups';
import {ref} from 'vue';

const promptValue = ref<string>('');

function resolveConfirm(value: boolean) {
	activeConfirm.value?.resolve(value);
}

function resolvePrompt() {
	activePrompt.value?.resolve(promptValue.value);
	promptValue.value = '';
}
</script>

<style scoped>
#popups {
	position: fixed;
	left: 0;
	right: 0;
	top: 10vh;
}

#alerts {
	position: absolute;
	right: 10vh;
	padding: 2em;
}

#confirm,
#prompt {
	position: relative;
	width: min(768px, 90vw);
	margin: 0 auto;

	@apply shadow-xl;
}

.alert,
#confirm,
#prompt {
	border-radius: 1ch;
	padding: 1em;
	margin-bottom: 2em;
}

.title {
	font-weight: bold;
}

.info {
	color: var(--color-background);
	background-color: #157c5f;
}

.notice {
	color: var(--color-background);
	background-color: #7a7714;
}

.warning {
	color: var(--color-background);
	background-color: #b44614;
}

form input {
	display: inline-block;
}

.move,
.popup-enter-active,
.popup-leave-active {
	transition: all 0.5s ease;
}

.popup-enter-from,
.popup-leave-to {
	transform: translateY(-50%);
	opacity: 0;
}
</style>
