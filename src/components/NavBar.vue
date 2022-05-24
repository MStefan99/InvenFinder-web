<template lang="pug">
nav
	span.clickable(@click="appState.activeTab='inventory'") Inventory
	span.clickable(@click="appState.activeTab='users'") Users
	span.clickable(@click="appState.activeTab='settings'") Settings
</template>


<script>
import store from '../store.js'

export default {
	name: 'NavBar',
	data() {
		return {appState: store};
	}
};
</script>


<style lang="stylus">
@require "../res/colors.styl"

nav
	position sticky
	top 0
	width 100vw
	overflow-x hidden
	padding 1em 1.5em
	background var(--color-navbar)
	color var(--color-accent)
	backdrop-filter blur(1em)
	font-weight bold
	border-radius 0 0 1em 1em
	box-shadow 0 0 2em 1em var(--color-shadow)
	display flex
	flex-flow row nowrap
	align-items center

	& > *
		margin-right 1.5em

	.clickable
		cursor pointer
</style>
