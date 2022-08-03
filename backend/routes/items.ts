import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import Item from '../lib/item.ts';
import { PERMISSIONS } from '../../common/permissions.ts';

const locationRegex = /^[1-9]\d*-[A-Z]+[1-9]\d*$/;

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

		if (body.name === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'NO_NAME', message: 'No name' };
			return;
		}
		if (body.location === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_LOCATION',
				message: 'No location',
			};
			return;
		}
		if (body.amount === undefined || !Number.isInteger(body.amount)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'No or invalid amount',
			};
			return;
		}
		if (!body.location.match(locationRegex)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_LOCATION',
				message: 'Invalid location',
			};
			return;
		}

		const item = await Item.create({
			name: body.name,
			description: body.description,
			link: body.link,
			location: body.location,
			amount: +body.amount,
		});

		ctx.response.status = 201;
		ctx.response.body = item;
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_BODY',
			message: 'Invalid request body',
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
					message: 'Invalid ID',
				};
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;
			if (body.amount === undefined || +body.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Invalid amount',
				};
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item not found',
				};
				return;
			}

			item.amount = body.amount;

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_BODY',
				message: 'Invalid request body',
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
					message: 'Invalid ID',
				};
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item not found',
				};
				return;
			}
			const amount = +body.amount;
			if (body.amount !== undefined) {
				if (!Number.isInteger(amount) || amount < 0) {
					ctx.response.status = 400;
					ctx.response.body = {
						error: 'INVALID_AMOUNT',
						message: 'Invalid amount',
					};
					return;
				}
			}
			if (
				body.location !== undefined &&
				!body.location.match(locationRegex)
			) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_LOCATION',
					message: 'Invalid location',
				};
				return;
			}

			if (body.name !== undefined) {
				item.name = body.name;
			}
			if (body.description !== undefined) {
				item.description = body.description;
			}
			if (body.link !== undefined) {
				item.link = body.link;
			}
			if (body.location !== undefined) {
				item.location = body.location;
			}
			if (body.amount !== undefined) {
				item.amount = amount;
			}

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_BODY',
				message: 'Invalid request body',
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
					message: 'Invalid ID',
				};
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'ITEM_NOT_FOUND',
					message: 'Item not found',
				};
				return;
			}

			await item.delete();

			ctx.response.status = 200;
			ctx.response.body = { message: 'OK' };
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_BODY',
				message: 'Invalid request body',
			};
		}
	},
);

export default router;
