<template lang="pug">
#loans
	h2.text-accent.text-2xl.mb-4 My loans
	div(v-if="pendingLoans.length")
		h4.text-accent.text-lg.my-4 Pending
		table
			tbody
				tr(v-for="loan in pendingLoans" :key="loan.id")
					td My loan for
					td {{loan.amount}}
					td items
					td(v-if="loan.approved") was approved
					td(v-else) is pending approval
	div(v-if="approvedLoans.length")
		h4.text-accent.text-lg.my-4 Approved
		table
			tbody
				tr(v-for="loan in approvedLoans" :key="loan.id")
					td My loan for
					td {{loan.amount}}
					td items
					td(v-if="loan.approved") was approved
					td(v-else) is pending approval
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import type {Loan} from '../scripts/types';
import Api from '../scripts/api';
import {alert, PopupColor} from '../scripts/popups';

const loans = ref<Loan[]>([]);
const pendingLoans = computed(() => loans.value.filter((l) => !l.approved));
const approvedLoans = computed(() => loans.value.filter((l) => l.approved));

window.document.title = 'My loans | Invenfinder';

Api.loans
	.getMine()
	.then((l) => (loans.value = l))
	.catch((err) => alert('Could not load the loans', PopupColor.Red, err.message));
</script>

<style scoped></style>
