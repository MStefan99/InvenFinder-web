<template lang="pug">
#loans(v-if="appState.features.loans")
	h2.text-accent.text-2xl.mb-4 {{title ?? 'Loans'}}
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
	slot(v-if="!loans.length") No active loans
</template>

<script setup lang="ts">
import type { ItemLoan } from '../scripts/types';
import { computed } from 'vue';
import appState from '../scripts/store';

const props = defineProps<{ loans: ItemLoan[]; title?: string }>();
const pendingLoans = computed(() => props.loans.filter((l) => !l.approved));
const approvedLoans = computed(() => props.loans.filter((l) => l.approved));
</script>
