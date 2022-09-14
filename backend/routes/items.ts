import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import Item from '../lib/item.ts';
import { PERMISSIONS } from '../../common/permissions.ts';

const router = new Router({
	prefix: '/items',
});

// Get all items
router.get('/', auth.authenticated(), async (ctx) => {
	ctx.response.body = await Item.getAll();
});

// Get item by ID
router.get('/:id', auth.authenticated(), async (ctx) => {
	const parsedID = +ctx.params.id;

	if (Number.isNaN(parsedID)) {
		ctx.response.status = 400;
		ctx.response.body = { error: 'ID_NAN', message: 'ID must be a number' };
		return;
	}

	ctx.response.body = await Item.getByID(parsedID);
});

// Add item
router.post('/', auth.permissions([PERMISSIONS.MANAGE_ITEMS]), async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (!body.name.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_NAME',
				message: 'Name must be provided',
			};
			return;
		}
		if (!body.location.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_LOCATION',
				message: 'Location must be provided',
			};
			return;
		}
		if (body.amount === undefined || +body.amount < 0) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'Amount must be a positive number',
			};
			return;
		}

		const item = await Item.create({
			name: body.name.trim(),
			description: body.description?.trim() ?? null,
			link: body.link?.trim() ?? null,
			location: body.location.trim(),
			amount: +body.amount,
		});

		ctx.response.status = 201;
		ctx.response.body = item;
	} catch (e) {
		console.error(e);
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message:
				'Could not process your request, please check for errors and retry',
		};
	}
});

// Change item amount
router.put(
	'/:id/amount',
	auth.permissions([PERMISSIONS.EDIT_ITEM_AMOUNT]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_ID',
					message: 'ID must be a number',
				};
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;
			if (body.amount === undefined || +body.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Amount must be a positive number',
				};
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item was not found',
				};
				return;
			}

			item.amount = body.amount;
			item.save();

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch (e) {
			console.error(e);

			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message:
					'Could not process your request, please check for errors and retry',
			};
		}
	},
);

// Edit item
router.patch(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_ID',
					message: 'ID must be a number',
				};
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item was not found',
				};
				return;
			}
			const amount = +body.amount;
			if (body.amount !== undefined) {
				if (!Number.isInteger(amount) || amount < 0) {
					ctx.response.status = 400;
					ctx.response.body = {
						error: 'INVALID_AMOUNT',
						message: 'Amount must be a positive number',
					};
					return;
				}
			}

			if (body.name?.length) {
				item.name = body.name.trim();
			}
			if (body.description !== undefined) {
				item.description = body.description?.trim() ?? null;
			}
			if (body.link !== undefined) {
				item.link = body.link?.trim() ?? null;
			}
			if (body.location?.length) {
				item.location = body.location.trim();
			}
			if (body.amount !== undefined) {
				item.amount = amount;
			}

			item.save();

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch (e) {
			console.error(e);
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message:
					'Could not process your request, please check for errors and retry',
			};
		}
	},
);

// Delete item
router.delete(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_ID',
					message: 'ID must be a number',
				};
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item was not found',
				};
				return;
			}

			item.delete();

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch (e) {
			console.error(e);

			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message:
					'Could not process your request, please check for errors and retry',
			};
		}
	},
);

export default router;
