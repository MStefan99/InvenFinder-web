import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import { PERMISSIONS } from '../lib/permissions.ts';
import Item from '../lib/item.ts';
import Location from '../lib/location.ts';

const router = new Router({
	prefix: '/items',
});

router.get('/', auth.authenticated(), async (ctx) => {
	ctx.response.body = await Item.getAll();
});

router.get('/:id', auth.authenticated(), async (ctx) => {
	const parsedID = +ctx.params.id;

	if (Number.isNaN(parsedID)) {
		ctx.response.status = 400;
		ctx.response.body = { error: 'ID must be a number' };
		return;
	}

	ctx.response.body = await Item.getByID(parsedID);
});

router.put(
	'/:id/amount',
	auth.permissions([PERMISSIONS.EDIT_ITEM_AMOUNT]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Invalid ID' };
				return;
			}
			const body = await ctx.request.body({ type: 'json' }).value;
			if (body.amount === undefined || +body.amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Invalid amount' };
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Item not found' };
				return;
			}

			item.amount = body.amount;

			ctx.response.status = 200;
			ctx.response.body = item;
		} catch (e) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'Invalid request body' };
		}
	},
);

router.post('/', auth.permissions([PERMISSIONS.MANAGE_ITEMS]), async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.name === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No name' };
			return;
		}
		if (body.location === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No location' };
			return;
		}
		if (body.amount === undefined || !Number.isInteger(body.amount)) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No or invalid amount' };
			return;
		}
		const location = Location.parse(body.location);
		if (location === null) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'Invalid location' };
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
		ctx.response.body = { error: 'Invalid request body' };
	}
});

router.delete(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		try {
			const id = +ctx.params.id;
			if (!Number.isInteger(id)) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Invalid ID' };
				return;
			}

			const item = await Item.getByID(id);
			if (item === null) {
				ctx.response.status = 400;
				ctx.response.body = { error: 'Item not found' };
				return;
			}

			await item.delete();

			ctx.response.status = 200;
			ctx.response.body = { message: 'OK' };
		} catch (e) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'Invalid request body' };
		}
	},
);

export default router;
