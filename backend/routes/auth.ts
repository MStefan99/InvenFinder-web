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
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'No username',
			};
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_PASSWORD',
				message: 'No password',
			};
			return;
		}

		await next();
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message: 'Invalid request body',
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
	ctx.response.body = { key: session.publicID, user };
});

// Log in
router.post('/login', credentialsPresent, async (ctx) => {
	// No 'try' because already present in middleware

	const body = await ctx.request.body({ type: 'json' }).value;
	const user = await User.getByUsername(body.username);

	if (user === null) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User not found',
		};
		return;
	} else if (!(await user.verifyPassword(body.password))) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'WRONG_PASSWORD',
			message: 'Incorrect password',
		};
		return;
	}

	const session = await Session.create(
		user,
		ctx.request.ip,
		ctx.request.headers.get('user-agent') ?? 'Unknown',
	);

	ctx.response.status = 201;
	ctx.response.body = { key: session.publicID, user };
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
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User not found',
		};
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
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User not found',
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

		user.save();

		ctx.response.status = 200;
		ctx.response.body = user;
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message: 'Invalid request body',
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
					error: 'NO_USERNAME',
					message: 'Username not provided',
				};
				return;
			}

			const user = await User.getByUsername(ctx.params.username);
			if (user === null) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'USER_NOT_FOUND',
					message: 'User not found',
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

			user.save();

			ctx.response.status = 200;
			ctx.response.body = user;
		} catch {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message: 'Invalid request body',
			};
		}
	},
);

// Get sessions
router.get('/sessions', auth.authenticated(), async (ctx) => {
	const user = await auth.methods.getUser(ctx);
	if (user === null) {
		ctx.response.status = 500;
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User not found',
		};
		return;
	}

	ctx.response.body = await Session.getUserSessions(user);
});

// Log out other session
router.delete('/sessions/:id', auth.authenticated(), async (ctx) => {
	const currentSession = await auth.methods.getSession(ctx);
	const otherSession = await Session.getByPublicID(ctx.params.id);

	if (currentSession === null || otherSession === null) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'SESSION_NOT_FOUND',
			message: 'Session not found',
		};
		return;
	}

	if (currentSession.userID !== otherSession.userID) {
		ctx.response.status = 403;
		ctx.response.body = {
			error: 'NOT_AUTHORIZED',
			message: 'Not authorized',
		};
		return;
	}

	otherSession.delete();

	ctx.response.status = 200;
	ctx.response.body = { message: 'OK' };
});

// Log out all sessions
router.delete('/sessions', auth.authenticated(), async (ctx) => {
	const user = await auth.methods.getUser(ctx);
	if (user === null) {
		ctx.response.status = 500;
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User not found',
		};
		return;
	}

	Session.deleteAllUserSessions(user);

	ctx.response.status = 200;
	ctx.response.body = { message: 'OK' };
});

// Log out
router.get('/logout', auth.authenticated(), async (ctx) => {
	ctx.response.body = { message: 'OK' };

	const session = await auth.methods.getSession(ctx);
	session?.delete();
});

export default router;
