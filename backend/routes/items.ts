import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import { PERMISSIONS } from '../lib/permissions.ts';
import Item from '../lib/item.ts';
import Location from '../lib/location.ts';

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
		ctx.response.body = { error: 'ID must be a number', code: 'ID_NAN' };
		return;
	}

	ctx.response.body = await Item.getByID(parsedID);
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
				ctx.response.body = { error: 'Invalid ID', code: 'INVALID_ID' };
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;
			if (body.amount === undefined || +body.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'Invalid amount',
					code: 'INVALID_AMOUNT',
				};
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'Item not found',
					code: 'ITEM_NOT_FOUND',
				};
				return;
			}

			item.amount = body.amount;

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'Invalid request body',
				code: 'INVALID_BODY',
			};
		}
	},
);

// Add item
router.post('/', auth.permissions([PERMISSIONS.MANAGE_ITEMS]), async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.name === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No name', code: 'NO_NAME' };
			return;
		}
		if (body.location === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No location', code: 'NO_LOCATION' };
			return;
		}
		if (body.amount === undefined || !Number.isInteger(body.amount)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'No or invalid amount',
				code: 'INVALID_AMOUNT',
			};
			return;
		}
		const location = Location.parse(body.location);
		if (location === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'Invalid location',
				code: 'INVALID_LOCATION',
			};
			return;
		}

		const item = await Item.create({
			name: body.name,
			description: body.description,
			location,
			amount: +body.amount,
		});

		ctx.response.status = 201;
		ctx.response.body = item;
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'Invalid request body',
			code: 'INVALID_BODY',
		};
	}
});

// Delete item
router.delete(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Invalid ID', code: 'INVALID_ID' };
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'Item not found',
					code: 'ITEM_NOT_FOUND',
				};
				return;
			}

			await item.delete();

			ctx.response.status = 200;
			ctx.response.body = { message: 'OK' };
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'Invalid request body',
				code: 'INVALID_BODY',
			};
		}
	},
);

export default router;
