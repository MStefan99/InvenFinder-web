<template lang="pug">
#item
	h2.text-accent.text-2xl.mb-4 Item details
	div(v-if="item")
		.flex.justify-between
			.grow.mr-2
				TextEditable.mb-2(
					v-model="item.name"
					text-class="text-2xl font-bold"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
					@update:modelValue="editItem()")
				h3 Location
				.flex.items-baseline.mb-4
					img.icon.mr-2(src="/src/assets/shelf.svg")
					TextEditable.grow(
						v-model="item.location"
						text-class="text-xl font-semibold"
						:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
						@update:modelValue="editItem()")
			.shrink-0.flex.items-baseline
				img.icon.mr-2(src="/src/assets/warehouse.svg")
				TextEditable(
					v-model="item.amount"
					type="number"
					@update:modelValue="editItem()"
					:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])")
		h3 Description
		TextEditable.mb-2(
			v-model="item.description"
			placeholder="No description"
			multiline
			:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
			@update:modelValue="editItem()")
		h3 Links
		TextEditable.mb-4(
			v-model="item.link"
			label="More details"
			placeholder="No links"
			text-class="text-muted"
			multiline
			@update:modelValue="editItem()"
			:readonly="!appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])")
			template(v-slot="{text}")
				RouterLink.btn.block.mb-2(
					v-for="link in text?.split(`\n`)"
					:key="link"
					:to="{name: 'file', params: {id: item.id, file: link.replace('file:', '')}}") {{link.replace('file:', 'File: ')}}
		form.flex.mb-4(
			v-if="appState.features.uploads && appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])"
			:action="appState.backendURL + '/items/' + item.id + '/upload'"
			method="post"
			enctype="multipart/form-data"
			@submit.prevent="(e) => uploadFiles(e)")
			.row
				label.btn {{fileLabel}}
					input(
						type="file"
						multiple
						name="files"
						@change="(e) => (fileLabel = e.target.files ? e.target.files.length + ' files selected' : 'Select files to upload')")
				button Upload files
		.row
			button(v-if="appState.hasPermissions([PERMISSIONS.LOAN_ITEMS])" @click="loanItem()") Loan this item
			button(
				v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])"
				@click="editAmount(false)") Take from storage
			button(v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT])" @click="editAmount(true)") Put in storage
			button.red(v-if="appState.hasPermissions([PERMISSIONS.MANAGE_ITEMS])" @click="deleteItem()") Delete item
		div(v-if="appState.features.loans && loans.length")
			div(
				v-if="appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT, PERMISSIONS.MANAGE_ITEMS], true)")
				h3.text-accent.text-xl.my-4 Loans for this item
				div(v-if="pendingLoans.length")
					h4.text-accent.text-lg.my-4 Pending
					.row.mb-4(v-for="loan in pendingLoans" :key="loan.id")
						p.self-center.inline-flex.gap-1
							b {{loan.username}}
							|
							| is asking to loan
							TextEditable.inline(type="number" v-model="loan.amount" @update:modelValue="editLoan(loan)")
							span items
						.row
							button(@click="approveLoan(loan, true)") Approve
							button.red(@click="deleteLoan(loan)") Delete
				div(v-if="approvedLoans.length")
					h4.text-accent.text-lg.my-4 Approved
					.row.mb-4(v-for="loan in approvedLoans" :key="loan.id")
						p.self-center.inline-flex.gap-1
							b {{loan.username}}
							|
							| has loaned
							TextEditable.inline(type="number" v-model="loan.amount" @update:modelValue="editLoan(loan)")
							span items
						.row
							button(@click="deleteLoan(loan, true)") Returned
							button.red(@click="deleteLoan(loan, false)") Delete
			div(v-else-if="appState.hasPermissions([PERMISSIONS.LOAN_ITEMS]) && myLoans.length")
				h4.text-accent.text-lg.my-4 My loans for this item
				.flex.flex-wrap.items-center.gap-1(v-for="loan in myLoans" :key="loan.id")
					span Your loan for
					TextEditable.inline(
						type="number"
						v-model="loan.amount"
						:readonly="loan.approved"
						text-class="font-bold"
						@update:modelValue="editLoan(loan)")
					span(v-if="loan.approved") items was approved
					span(v-else) items is pending approval
					button.red(v-if="!loan.approved" @click="deleteLoan({...loan, username: 'you'}, false)") Delete
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

import TextEditable from '../components/TextEditable.vue';
import type {Item, Loan, UserLoan} from '../scripts/types';
import appState from '../scripts/store';
import Api from '../scripts/api';
import {PERMISSIONS} from '../../../common/permissions';
import {alert, confirm, PopupColor, prompt} from '../scripts/popups';

const item = ref<Item | null>(null);
const route = useRoute();
const router = useRouter();
const fileLabel = ref<string>('Select files to upload');

const loans = ref<Loan[]>([]);
const pendingLoans = computed(() => loans.value.filter((l) => !l.approved));
const approvedLoans = computed(() => loans.value.filter((l) => l.approved));
const myLoans = computed(() => loans.value.filter((l) => l.userID === appState.user.id));

onMounted(() => {
	const idParam = route.params.id instanceof Array ? route.params.id[0] : route.params.id;
	const id = +idParam;

	if (Number.isNaN(id)) {
		console.error('Item ID is not a number:', idParam);
		return;
	}

	Api.items
		.getByID(id)
		.then((i) => {
			item.value = i;
			window.document.title = i.name + ' | Invenfinder';
			if (!route.params.name) {
				router.replace({name: 'item', params: {id, name: i.name.replace(/\s+/g, '_')}});
			}
		})
		.catch((err) => alert('Could not load the item', PopupColor.Red, err.message));

	if (appState.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT, PERMISSIONS.MANAGE_ITEMS], true)) {
		Api.loans
			.getByItem(id)
			.then((l) => (loans.value = l))
			.catch((err) => alert('Could not load the loans', PopupColor.Red, err.message));
	} else if (appState.hasPermissions([PERMISSIONS.LOAN_ITEMS])) {
		Api.loans
			.getMineByItem(id)
			.then((l) => (loans.value = l))
			.catch((err) => alert('Could not load the loans', PopupColor.Red, err.message));
	}
});

async function uploadFiles(e: SubmitEvent) {
	const body = new FormData();
	for (const file of ((e.target as HTMLFormElement).files as HTMLInputElement).files) {
		body.append('file', file);
	}

	item.value.link = await Api.items.uploadFiles(item.value.id, body);
}

async function loanItem() {
	const amount = +(await prompt('Choose amount', PopupColor.Accent, 'How many items do you need?'));

	if (amount < 1) {
		alert('Incorrect amount', PopupColor.Red, 'The amount cannot be negative or zero');
		return;
	}

	Api.loans
		.add(item.value.id, amount)
		.then((l) => {
			loans.value.push(l);
			alert('Loan request placed', PopupColor.Green, 'Loan request successfully placed');
		})
		.catch((err) => alert('Could not place loan request', PopupColor.Red, err.message));
}

function editItem() {
	item.value &&
		Api.items
			.edit(item.value)
			.then((i) => (item.value = i))
			.catch((err) =>
				alert('Could not save ' + item.value.name || 'the item', PopupColor.Red, err.message)
			);
}

async function approveLoan(loan: UserLoan, approved: boolean) {
	if (
		!(await confirm(
			'Approve loan?',
			PopupColor.Accent,
			`Are you sure you want to approve the loan request for ${loan.amount} items by ${loan.username}? The items will be transferred from inventory to the user`
		))
	) {
		return;
	}

	loan.approved = approved;
	Api.loans
		.edit(loan)
		.then((l) => {
			item.value.amount = l.itemAmount;
		})
		.catch((err) => {
			alert('Could not approve this loan request', PopupColor.Red, err.message);
			loan.approved = !approved;
		});
}

function editLoan(loan: UserLoan) {
	Api.loans
		.edit(loan)
		.then((l) => {
			item.value.amount = l.itemAmount;
		})
		.catch((err) => {
			alert('Could not edit this loan', PopupColor.Red, err.message);
		});
}

async function deleteLoan(loan: UserLoan, returned?: boolean) {
	if (
		!(await confirm(
			loan.approved && returned ? 'Mark as returned?' : 'Delete loan?',
			PopupColor.Red,
			!loan.approved
				? `Are you sure you want to delete the loan request for ${loan.amount} items by ${loan.username}?`
				: returned
					? `Are you sure you want to mark the loan for ${loan.amount} items by ${loan.username} as returned? The loaned items will be transferred from the user to inventory`
					: `Are you sure you want to delete the loan for ${loan.amount} items by ${loan.username}? The loaned items will be lost`
		))
	) {
		return;
	}

	Api.loans
		.delete(loan, returned)
		.then(() => {
			loans.value.splice(loans.value.indexOf(loan), 1);

			if (returned) {
				item.value.amount += loan.amount;
			}
		})
		.catch((err) => alert('Could not delete this loan', PopupColor.Red, err.message));
}

async function editAmount(add = false) {
	const diff = +((await prompt('Choose amount', PopupColor.Accent)) ?? 0);

	if (Number.isNaN(diff)) {
		return;
	}

	if (!item.value) {
		return;
	}

	const oldAmount = item.value.amount;
	item.value.amount = add ? item.value.amount + diff : item.value.amount - diff;

	if (item.value.amount < 0) {
		alert(
			'Invalid amount',
			PopupColor.Red,
			'You have entered an invalid amount ' +
				'as the number of items would turn negative. Please try again.'
		);
		item.value.amount = oldAmount;
		return;
	}

	Api.items
		.editAmount(item.value.id, item.value.amount)
		.then((i) => (item.value.amount = i.amount))
		.catch((err) => {
			item.value.amount = oldAmount;
			alert('Could not change the amount', PopupColor.Red, err.message);
		});
}

async function deleteItem() {
	if (
		await confirm(
			'Delete this item?',
			PopupColor.Red,
			'Are you sure you want to delete ' + item.value.name + '?'
		)
	) {
		Api.items
			.delete(item.value)
			.then(() => router.push({name: 'home'}))
			.catch((err) =>
				alert('Could not delete ' + item.value.name || 'the item', PopupColor.Red, err.message)
			);
	}
}
</script>

<style scoped>
input {
	@apply block;
}

td {
	padding: 0.5em 0.25ch;
}

h3 {
	display: block;
	margin-bottom: 0.6em;
	font-weight: bold;
}
</style>
