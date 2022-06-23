import { Context, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';

type Next = () => Promise<unknown>;

const router = new Router();

async function credentialsPresent(ctx: Context, next: Next) {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.username === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No username', code: 'NO_USERNAME' };
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = { error: 'No password', code: 'NO_PASSWORD' };
			return;
		}

		await next();
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'Invalid request body',
			code: 'INVALID_REQUEST',
		};
	}
}

router.post('/login', credentialsPresent, async (ctx) => {
	// No 'try' because already present in middleware

	const body = await ctx.request.body({ type: 'json' }).value;
	const user = await User.getByUsername(body.username);

	if (user === null) {
		ctx.response.status = 400;
		ctx.response.body = { error: 'User not found', code: 'NO_USER' };
		return;
	} else if (!(await user.verifyPassword(body.password))) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'Incorrect password',
			code: 'WRONG_PASSWORD',
		};
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

router.get('/me', auth.authenticated(), async (ctx) => {
	const user = await auth.methods.getUser(ctx);

	if (!user) {
		// Should in theory never get here
		ctx.response.status = 500;
		ctx.response.body = { error: 'User not found' };
	} else {
		ctx.response.status = 200;
		ctx.response.body = user;
	}
});

router.get('/logout', auth.authenticated(), async (ctx) => {
	ctx.response.body = { message: 'OK' };

	const session = await auth.methods.getSession(ctx);
	session?.delete(); // await not needed, response may be returned before session is deleted
});

export default router;
