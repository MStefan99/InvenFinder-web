import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import Loan from '../lib/loan.ts';
import Item from '../lib/item.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { handleErrors } from '../lib/errors.ts';

const router = new Router({
	prefix: '/loans',
});

// Loan requests are added through an item router

// Change loan status
router.patch(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		await handleErrors(ctx, async () => {
			const body = await ctx.request.body({ type: 'json' }).value;

			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_ID',
					message: 'ID must be a number',
				};
				return;
			}

			const loan = await Loan.getByID(id);
			if (loan === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'LOAN_NOT_FOUND',
					message: 'Loan was not found',
				};
				return;
			}

			const item = await Item.getByID(loan.itemID);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item was not found',
				};
				return;
			}

			if (body.approved === true && !loan.approved) {
				loan.approved = true;
				item.amount -= loan.amount;

				loan.save();
				item.save();
			}

			ctx.response.status = 200;
			ctx.response.body = loan;
		});
	},
);

// Delete loan
router.delete(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		await handleErrors(ctx, async () => {
			const body = await ctx.request.body({ type: 'json' }).value;

			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_ID',
					message: 'ID must be a number',
				};
				return;
			}

			const loan = await Loan.getByID(id);
			if (loan === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'LOAN_NOT_FOUND',
					message: 'Loan was not found',
				};
				return;
			}

			const item = await Item.getByID(loan.itemID);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item was not found',
				};
				return;
			}

			if (!body.returned ?? true) {
				item.amount += loan.amount;
				item.save();
			}

			loan.delete();

			ctx.response.status = 200;
			ctx.response.body = loan;
		});
	},
);

export default router;
