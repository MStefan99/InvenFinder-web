import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import Item from '../lib/item.ts';
import auth from '../lib/auth.ts';
import { PERMISSIONS } from '../lib/permissions.ts';

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

router.post('/', auth.permissions([PERMISSIONS.MANAGE_ITEMS]), (ctx) => {
	ctx.response.status = 418;
});

export default router;
