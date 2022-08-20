import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { credentialsPresent } from './middleware.ts';

const router = new Router();

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
				user.permissions = permissions;
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

// Log out
router.get('/logout', auth.authenticated(), async (ctx) => {
	ctx.response.body = { message: 'OK' };

	const session = await auth.methods.getSession(ctx);
	session?.delete();
});

export default router;
