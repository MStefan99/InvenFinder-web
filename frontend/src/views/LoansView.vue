<template lang="pug">
#loans
	h2.text-accent.text-2xl.mb-4 My loans
	.approved(v-if="approvedLoans.length")
		h4.text-accent.text-lg.my-4 Approved
		.loan.my-2(v-for="loan in approvedLoans" :key="loan.id")
			b {{loan.amount}}
			span.mr-2 x
			RouterLink.underline(:to="{name: 'item', params: {id: loan.itemID}}")
				b {{loan.itemName}}
	.pending(v-if="pendingLoans.length")
		h4.text-accent.text-lg.my-4 Pending
		.loan.my-2(v-for="loan in pendingLoans" :key="loan.id")
			b {{loan.amount}}
			span.mr-2 x
			RouterLink.underline(:to="{name: 'item', params: {id: loan.itemID}}")
				b {{loan.itemName}}
	span(v-if="!loans.length") You currently have no active loans
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import type {ItemLoan} from '../scripts/types';
import Api from '../scripts/api';
import {alert, PopupColor} from '../scripts/popups';

const loans = ref<ItemLoan[]>([]);
const pendingLoans = computed(() => loans.value.filter((l) => !l.approved));
const approvedLoans = computed(() => loans.value.filter((l) => l.approved));

window.document.title = 'My loans | Invenfinder';

Api.loans
	.getMine()
	.then((l) => (loans.value = l))
	.catch((err) => alert('Could not load the loans', PopupColor.Red, err.message));
</script>

<style scoped></style>
