<template lang="pug">
NavBar
p {{this.store}}
</template>


<script>
import store from './store.js'

import NavBar from './components/NavBar.vue';

export default {
	name: 'App',
	components: {
		NavBar
	},
	data() {
		return {store};
	}
};
</script>


<style lang="stylus">
*, *::before, *::after
	box-sizing border-box

body
	font-family sans-serif
	margin 0

a
	text-decoration none
	color inherit
</style>
