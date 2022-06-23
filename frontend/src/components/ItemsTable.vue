<template lang="pug">
ul
	li.mb-4(v-for="item in items")
		.item
			span.mr-4 {{item.name}}
			span.mr-4 {{item.description}}
			span.mr-4 {{item.location}}
			span.mr-4 {{item.amount}}
</template>

<script lang="ts">
import Api from '../scripts/api';

export default {
	name: 'ItemsTable',
	data() {
		return {
			items: []
		};
	},
	mounted() {
		this.loadItems();
	},
	methods: {
		loadItems() {
			Api.items.getAll().then((items) => (this.items = items));
		}
	}
};
</script>

<style scoped></style>
