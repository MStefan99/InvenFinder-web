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
				input.btn.btn-success(type="submit" value="Sign in")
</template>

<script lang="ts">
import {appState, Tab} from '../store';

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
			const password = this.state.password;
			this.state.password = null;

			fetch(this.appState.backendURL + '/api/auth/login', {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: this.state.username,
					password
				})
			})
				.then((res) => {
					if (!res.ok) {
						return Promise.reject();
					}
					return res.json();
				})
				.then((data) => {
					this.appState.apiKey = data.key;
					localStorage.setItem('apiKey', data.key);
				})
				.catch(() => {
					console.warn('Could not log in');
				});
		},
		logout() {
			fetch(this.appState.backendURL + '/api/logout', {
				headers: {
					'API-Key': this.appState.apiKey
				}
			}).then((res) => {
				if (!res.ok) {
					console.warn('Could not log out');
					return;
				}

				this.appState.apiKey = null;
			});

			localStorage.removeItem('apiKey');
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
