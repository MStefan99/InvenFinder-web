<template lang="pug">
NavBar
</template>


<script>
import NavBar from './components/NavBar.vue';

export default {
	name: 'App',
	components: {
		NavBar
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
