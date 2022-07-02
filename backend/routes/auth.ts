import { Context, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';
import { parsePermissions, PERMISSIONS } from '../../common/permissions.ts';

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

// Register
router.post('/register', credentialsPresent, async (ctx) => {
	const body = await ctx.request.body({ type: 'json' }).value;

	const user = await User.create(body.username, body.password, []);
	const session = await Session.create(
		user,
		ctx.request.ip,
		ctx.request.headers.get('user-agent') ?? 'Unknown',
	);

	ctx.response.status = 201;
	ctx.response.body = { key: session.publicID };
});

// Log in
router.post('/login', credentialsPresent, async (ctx) => {
	// No 'try' because already present in middleware

	const body = await ctx.request.body({ type: 'json' }).value;
	const user = await User.getByUsername(body.username);

	if (user === null) {
		ctx.response.status = 400;
		ctx.response.body = { error: 'User not found', code: 'USER_NOT_FOUND' };
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
	ctx.response.body = { key: session.publicID, user: user };
});

// Check authentication status
router.get('/auth', auth.authenticated(), (ctx) => {
	ctx.response.status = 200;
	ctx.response.body = { message: 'OK' };
});

// Get user currently logged in as
router.get('/me', auth.authenticated(), async (ctx) => {
	const user = await auth.methods.getUser(ctx);

	if (!user) {
		// Should in theory never get here
		ctx.response.status = 500;
		ctx.response.body = { error: 'User not found', code: 'USER_NOT_FOUND' };
	} else {
		ctx.response.status = 200;
		ctx.response.body = user;
	}
});

// Edit user currently logged in as
router.patch('/me', auth.authenticated(), async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'User not found',
				code: 'USER_NOT_FOUND',
			};
			return;
		}

		if (body.password !== undefined) {
			await user.setPassword(body.password);
		}
		if (await auth.test.permissions(ctx, [PERMISSIONS.MANAGE_USERS])) {
			if (body.username !== undefined) {
				user.username = body.username;
			}
			const permissions = +body.permissions;
			if (Number.isInteger(permissions)) {
				user.permissions = parsePermissions(permissions);
			}
		}

		ctx.response.status = 200;
		ctx.response.body = user;
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'Invalid request body',
			code: 'INVALID_REQUEST',
		};
	}
});

// Edit another user
router.patch(
	'/users/:username',
	auth.permissions([PERMISSIONS.MANAGE_USERS]),
	async (ctx) => {
		try {
			const body = await ctx.request.body({ type: 'json' }).value;
			if (ctx.params.username === undefined) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'Username not provided',
					code: 'NO_USERNAME',
				};
				return;
			}

			const user = await User.getByUsername(ctx.params.username);
			if (user === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'User not found',
					code: 'USER_NOT_FOUND',
				};
				return;
			}

			if (body.username !== undefined) {
				user.username = body.username;
			}
			if (body.password !== undefined) {
				await user.setPassword(body.password);
			}
			const permissions = +body.permissions;
			if (Number.isInteger(permissions)) {
				user.permissions = parsePermissions(permissions);
			}

			ctx.response.status = 200;
			ctx.response.body = user;
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'Invalid request body',
				code: 'INVALID_REQUEST',
			};
		}
	},
);

// Log out
router.get('/logout', auth.authenticated(), async (ctx) => {
	ctx.response.body = { message: 'OK' };

	const session = await auth.methods.getSession(ctx);
	session?.delete(); // await not needed, response may be returned before session is deleted
});

export default router;
