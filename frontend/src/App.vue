<template lang="pug">
header.no-print
	NavBar

main
	RouterView
	ConnectionDialog

footer
	.print
		p.text-muted Do not edit, this file was generated automatically by InvenFinder
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import ConnectionDialog from './components/ConnectionDialog.vue';
</script>

<style></style>
