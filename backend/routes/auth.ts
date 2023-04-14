import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import User from '../lib/user.ts';
import Session from '../lib/session.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { hasBody, hasCredentials } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';

const router = new Router();

// Register
router.post('/register', hasCredentials(), rateLimiter(), async (ctx) => {
	const body = await ctx.request.body({ type: 'json' }).value;

	const user = await User.create(
		body.username.trim(),
		body.password,
		[],
	);
	const session = await Session.create(
		user,
		ctx.request.ip,
		ctx.request.headers.get('user-agent') ?? 'Unknown',
	);

	ctx.response.status = 201;
	ctx.response.body = { key: session.publicID, user };
});

// Log in
router.post(
	'/login',
	hasCredentials(),
	rateLimiter({ tag: 'login', rate: 2, initial: 10, max: 10 }),
	async (ctx) => {
		const body = await ctx.request.body({ type: 'json' }).value;
		const user = await User.getByUsername(body.username.trim());

		if (user === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		} else if (!(await user.verifyPassword(body.password))) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'WRONG_PASSWORD',
				message: 'Wrong password',
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
	},
);

// Check authentication status
router.get(
	'/auth',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	(ctx) => {
		ctx.response.body = { message: 'OK' };
	},
);

// Get user currently logged in as
router.get(
	'/me',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);

		if (!user) {
			// Should in theory never get here
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
		} else {
			ctx.response.body = user;
		}
	},
);

// Edit user currently logged in as
router.patch(
	'/me',
	hasBody(),
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body({ type: 'json' }).value;

		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		if (body.password?.length) {
			await user.setPassword(body.password);
		}
		if (await auth.test.permissions(ctx, [PERMISSIONS.MANAGE_USERS])) {
			if (body.username?.length) {
				user.username = body.username.trim();
			}
			const permissions = +body.permissions;
			if (Number.isInteger(permissions)) {
				user.permissions = permissions;
			}
		}

		await user.save();

		ctx.response.body = user;
	},
);

// Log out
router.get(
	'/logout',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		ctx.response.body = { message: 'OK' };

		const session = await auth.methods.getSession(ctx);
		session?.delete();
	},
);

export default router;
