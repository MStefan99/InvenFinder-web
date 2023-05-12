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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = await Loan.getByUser(user);
	},
);

// Edit loan
router.patch(
	'/:id',
	hasBody(),
	auth.hasPermissions(
		[PERMISSIONS.LOAN_ITEMS, PERMISSIONS.MANAGE_ITEMS],
		true,
	),
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

		if (typeof body.amount === 'number' && body.amount < 0) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'Amount must be a positive number',
			};
			return;
		}

		const loan = await Loan.getByID(id);
		if (loan === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'LOAN_NOT_FOUND',
				message: 'Loan was not found',
			};
			return;
		}

		const item = await Item.getByID(loan.itemID);
		if (item === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		if (
			!(await auth.test.hasPermissions(ctx, [PERMISSIONS.MANAGE_ITEMS]))
		) {
			const user = await auth.methods.getUser(ctx);
			if (!user) {
				return;
			}

			if (loan.userID !== user.id) {
				ctx.response.status = 404;
				ctx.response.body = {
					error: 'LOAN_NOT_FOUND',
					message: 'Loan was not found',
				};
				return;
			}

			if (
				typeof body.approved === 'boolean' &&
				body.approved !== loan.approved
			) {
				ctx.response.status = 403;
				ctx.response.body = {
					error: 'NOT_AUTHORIZED',
					message: 'You are not allowed to approve loan requests',
				};
				return;
			}

			if (typeof body.amount === 'number') {
				if (loan.approved) {
					ctx.response.status = 400;
					ctx.response.body = {
						error: 'ALREADY_APPROVED',
						message:
							'You cannot change the amount since the loan has already been approved',
					};
					return;
				}
				loan.amount = body.amount;
			}
		} else {
			if (typeof body.amount === 'number' && loan.approved) {
				item.amount += loan.amount - body.amount;
			}
			loan.amount = body.amount;

			if (
				typeof body.approved === 'boolean' &&
				body.approved !== loan.approved
			) {
				item.amount = body.approved
					? item.amount - loan.amount
					: item.amount + loan.amount;
				loan.approved = body.approved;
			}

			if (item.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Not enough items to loan out',
				};
				return;
			}

			item.save();
		}

		loan.save();
		ctx.response.body = { ...loan, itemAmount: item.amount };
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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'LOAN_NOT_FOUND',
				message: 'Loan was not found',
			};
			return;
		}

		const item = await Item.getByID(loan.itemID);
		if (item === null) {
			ctx.response.status = 404;
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
