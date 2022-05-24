<template lang="pug">
nav
	a(href="/") Home
</template>


<script>
export default {
	name: 'NavBar'
};
</script>


<style lang="stylus" scoped>
nav
	width 100vw
	overflow-x hidden
	padding 1em
	background #05a18a
	color white
	display flex
	flex-flow row nowrap
	align-items center
</style>
