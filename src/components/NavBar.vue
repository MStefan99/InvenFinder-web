<template lang="pug">
nav
	a(href="/") Items
	a(href="/") Users
	a(href="/") Settings
</template>


<script>
export default {
	name: 'NavBar'
};
</script>


<style lang="stylus" scoped>
nav
	width 100vw
	overflow-x scroll
	padding 1em 1.5em
	background white
	color #05a18a
	backdrop-filter blur(1em)
	font-weight bold
	border-radius 0 0 1em 1em
	box-shadow 0 0 2em 1em #0000001a
	display flex
	flex-flow row nowrap
	align-items center

	& > *
		margin-right 1.5em
</style>
