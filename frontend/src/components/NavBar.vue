<template lang="pug">
nav.text-teal-700.font-semibold
	span
		span.clickable(@click="appState.activeTab = 'inventory'") Inventory
		span.clickable(@click="appState.activeTab = 'users'") Users
		span.clickable(@click="appState.activeTab = 'settings'") Settings
	span
		span.clickable(v-if="!appState.apiKey" @click="showLogin") Sign in
		span.clickable(v-else @click="logout") Sign out
Transition
	div#login-wrapper(v-if="state.showLogin" @click="closeLogin")
		div#login
			h2 Sign in
			form(@submit.prevent="login")
				section.form-group
					label(for="login-username") Username
					input#login-username(type="text" placeholder="user" v-model="state.username")
				section.form-group
					label(for="login-password") Password
					input#login-password(type="password" placeholder="password" v-model="state.password")
				input.btn.btn-success(type="submit" value="Sign in")
</template>

<script>
import store from '../store.js';

export default {
	name: 'NavBar',
	data() {
		return {
			appState: store,
			state: {
				username: null,
				password: null,
				showLogin: false
			}
		};
	},
	methods: {
		closeLogin(event) {
			if (!event || event.target.id === 'login-wrapper') {
				this.state.showLogin = false;
			}
		},
		showLogin() {
			this.state.showLogin = true;
		},
		login() {
			this.state.showLogin = false;
			const password = this.state.password;
			this.state.password = null;

			fetch(this.appState.backendURL + '/api/login', {
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
						console.warn('Could not log in');
						return;
					}
					return res.json();
				})
				.then((data) => {
					this.appState.apiKey = data.key;
					localStorage.setItem('apiKey', data.key);
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

<style lang="sass">
nav
	position: sticky
	top: 0
	padding: 1em 1.5em
	display: flex
	flex-flow: row nowrap
	justify-content: space-between
	backdrop-filter: blur(1em)
	border-radius: 0 0 1em 1em
	@apply shadow-neutral-300/10 shadow-xl

	.clickable
		cursor: pointer

		&:not(:last-child)
			margin-right: 1.5em


#login-wrapper
	position: fixed
	left: 0
	top: 0
	right: 0
	bottom: 0
	background-color: var(--color-overlay)
	box-shadow: 0 0 3em var(--color-shadow)

	#login
		position: relative
		left: 50%
		top: 50%
		max-width: 50vw
		transform: translate(-50%, -50%)
		padding: 4em
		border-radius: 1em
		background-color: var(--color-overlay)
		box-shadow: 0 1em 3em var(--color-shadow)
		backdrop-filter: blur(2em)

.v-enter-active, .v-leave-active
	transition: transform 0.5s ease-in-out

.v-enter-from, .v-leave-to
	transform: translateY(-100%)
</style>
