import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import Loan from '../orm/loan.ts';
import Item from '../orm/item.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { hasBody } from './middleware.ts';

const router = new Router({
	prefix: '/loans',
});

// Loan requests are retrieved and added through the item router

// Get current user loans
router.get(
	'/mine',
	auth.hasPermissions([PERMISSIONS.LOAN_ITEMS]),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = await Loan.getByUser(user);
	},
);

// Change loan status
router.patch(
	'/:id',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
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
			if (item.amount - loan.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Not enough items to loan out',
				};
				return;
			}
			loan.approved = true;
			item.amount -= loan.amount;

			loan.save();
			item.save();
		}

		ctx.response.body = loan;
	},
);

// Delete loan
router.delete(
	'/:id',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
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

		if (body.returned ?? false) {
			item.amount += loan.amount;
			item.save();
		}

		loan.delete();

		ctx.response.body = loan;
	},
);

export default router;
