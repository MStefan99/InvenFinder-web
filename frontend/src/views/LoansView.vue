<template lang="pug">
UserLoans(:loans="loans" title="Your loans")
	span You currently have no active loans
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {ItemLoan} from '../scripts/types';
import Api from '../scripts/api';
import {alert, PopupColor} from '../scripts/popups';
import UserLoans from '../components/UserLoans.vue';

const loans = ref<ItemLoan[]>([]);
window.document.title = 'My loans | Invenfinder';

Api.loans
	.getMine()
	.then((l) => (loans.value = l))
	.catch((err) => alert('Could not load the loans', PopupColor.Red, err.message));
</script>

<style scoped></style>
