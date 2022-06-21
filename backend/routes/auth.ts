import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';

const router = new Router({
	prefix: '/auth',
});

router.post('/login', async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.username === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No username provided' };
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No password provided' };
			return;
		}

		ctx.response.body = body.username;
	} catch (e) {
		ctx.response.status = 400;
		if (e instanceof SyntaxError) {
			ctx.response.body = { error: 'Invalid body' };
		} else {
			ctx.response.body = { error: 'Unknown error' };
		}
	}
});

export default router;
