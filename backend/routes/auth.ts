import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';

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

		const user = await User.getByUsername(body.username);

		if (user === null) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'User not found' };
			return;
		} else if (!await user.verifyPassword(body.password)) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'Incorrect password' };
			return;
		}

		const session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
		);

		ctx.response.status = 201;
		ctx.response.body = { key: session.publicID };
	} catch (e) {
		ctx.response.status = 400;
		if (e instanceof SyntaxError) {
			ctx.response.body = { error: 'Invalid body' };
		} else {
			console.error(e);
			ctx.response.body = { error: 'Unknown error' };
		}
	}
});

router.post('/register', async (ctx) => {
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

		const user = await User.create(body.username, body.password, undefined);
		const session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
		);

		ctx.response.status = 201;
		ctx.response.body = { key: session.publicID };
	} catch (e) {
		ctx.response.status = 400;
		if (e instanceof SyntaxError) {
			ctx.response.body = { error: 'Invalid body' };
		} else {
			console.error(e);
			ctx.response.body = { error: 'Unknown error' };
		}
	}
});

export default router;
