<template lang="pug">
.notifications
	TransitionGroup(name="notification")
		.notification(v-for="notification in activeAlerts" :key="notification.title")
			.title {{notification.title}}
			.details {{notification.details}}
	.confirm(v-if="activeConfirm")
		.title {{activeConfirm.confirm.title}}
		.details {{activeConfirm.confirm.details}}
		button(@click="resolveConfirm(true)") Yes
		button(@click="resolveConfirm(false)") No
</template>

<script setup lang="ts">
import {activeAlerts, activeConfirm} from '../scripts/notifications.ts';

function resolveConfirm(value: boolean) {
	activeConfirm.value.resolve(value);
	activeConfirm.value = null;
}
</script>

<style scoped>
.notifications {
	position: fixed;
	right: 10vh;
	top: 10vh;
}

.notification {
	border-radius: 1ch;
	padding: 1em;
}

.notification .title {
	font-weight: bold;
}

.notification.info {
	color: var(--color-background);
	background-color: #179e74;
}

.move,
.notification-enter-active,
.notification-leave-active {
	transition: all 0.5s ease;
}

.notification-enter-from,
.notification-leave-to {
	transform: translateX(50%);
	opacity: 0;
}
</style>
