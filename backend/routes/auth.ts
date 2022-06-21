import { Context, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';

type Next = () => Promise<unknown>;

const router = new Router({
	prefix: '/auth',
});

async function credentialsPresent(ctx: Context, next: Next) {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.username === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No username' };
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No password' };
			return;
		}

		await next();
	} catch (e) {
		ctx.response.status = 400;
		ctx.response.body = { error: 'Invalid request body' };
	}
}

router.post('/login', credentialsPresent, async (ctx) => {
	const body = await ctx.request.body({ type: 'json' }).value;
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
});

router.post('/register', credentialsPresent, async (ctx) => {
	const body = await ctx.request.body({ type: 'json' }).value;

	const user = await User.create(body.username, body.password, undefined);
	const session = await Session.create(
		user,
		ctx.request.ip,
		ctx.request.headers.get('user-agent') ?? 'Unknown',
	);

	ctx.response.status = 201;
	ctx.response.body = { key: session.publicID };
});

router.get('/logout', auth.authenticated(), (ctx) => {
	ctx.response.body = { message: 'OK' };

	ctx.state.session.delete();
});

export default router;
