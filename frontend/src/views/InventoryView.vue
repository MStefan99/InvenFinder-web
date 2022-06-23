<template lang="pug">
h2.text-teal-700.text-2xl.mb-4 Inventory
</template>

<script lang="ts">
import ItemsTable from '../components/ItemsTable.vue';

export default {
	name: 'InventoryView',
	components: {
		ItemsTable
	}
};
</script>

<style scoped></style>
