<template lang="pug">
.notifications
	TransitionGroup(name="notification")
		.notification(
			v-for="notification in notifications"
			:key="notification.n.title"
			:class="notification.n.type")
			.title {{notification.n.title}}
			.info {{notification.n.details}}
</template>

<script setup lang="ts">
import {notifications} from '../scripts/notifications.ts';
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
	color: var(--color-background);
}

.notification .title {
	font-weight: bold;
}

.notification.info {
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
