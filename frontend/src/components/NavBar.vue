<template lang="pug">
nav.text-teal-700.font-semibold
	span
		span.clickable.mr-2(@click="appState.openTab(Tab.Inventory)") Inventory
		span.clickable.mr-2(@click="appState.openTab(Tab.Users)") Users
		span.clickable.mr-2(@click="appState.openTab(Tab.Settings)") Settings
	span
		span.clickable.mr-2(v-if="!appState.apiKey" @click="state.showLogin = true") Sign in
		span.clickable.mr-2(v-else @click="logout") Sign out
Transition(name="popup")
	.popup-wrapper(v-if="state.showLogin" @click.self="state.showLogin = false")
		.popup
			h2.text-3xl.font-bold.mb-3 Sign in
			form(@submit.prevent="login")
				section.form-group
					label(for="login-username") Username
					input#login-username(type="text" placeholder="user" v-model="state.username")
				section.form-group
					label(for="login-password") Password
					input#login-password(type="password" placeholder="password" v-model="state.password")
				input.btn.btn-success.clickable(type="submit" value="Sign in")
</template>

<script lang="ts">
import {appState, Tab} from '../scripts/store';
import Api from '../scripts/api';

export default {
	name: 'NavBar',
	data() {
		return {
			appState,
			Tab,
			state: {
				username: null,
				password: null,
				showLogin: false
			}
		};
	},
	methods: {
		login() {
			this.state.showLogin = false;
			Api.login(this.state.username, this.state.password).then((success) =>
				console.log('Logged in:', success)
			);
		},
		logout() {
			Api.logout();
		}
	}
};
</script>

<style scoped>
nav {
	position: sticky;
	top: 0;
	padding: 1em 1.5em;
	display: flex;
	flex-flow: row nowrap;
	justify-content: space-between;
	backdrop-filter: blur(1em);
	border-radius: 0 0 1em 1em;
	@apply shadow-neutral-300/10 shadow-xl;
}

nav:not(:last-child) {
	margin-right: 1.5em;
}

nav .clickable {
	cursor: pointer;
}

label {
	display: block;
}

input {
	@apply border-2 border-teal-500 rounded-xl w-full p-2 my-3 shadow;
}

input[type='submit'] {
	@apply bg-teal-500 font-bold text-white text-xl shadow-md;
}
</style>
