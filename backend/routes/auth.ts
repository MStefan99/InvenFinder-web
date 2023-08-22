import { Middleware, Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import User from '../orm/user.ts';
import Session from '../orm/session.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { hasBody, hasCredentials } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';
import Loan from '../orm/loan.ts';
import log from '../lib/log.ts';

const router = new Router();

function accountsEnabled(): Middleware {
	if (Deno.env.has('NO_ACCOUNTS')) {
		return (ctx, _next) => {
			ctx.response.status = 422;
			ctx.response.body = {
				error: 'ACCOUNTS_DISABLED',
				message:
					'Account management is disabled for this Invenfinder installation',
			};
			return;
		};
	} else {
		return async (_ctx, next) => {
			await next();
		};
	}
}

// Register
router.post(
	'/register',
	accountsEnabled(),
	hasCredentials(),
	rateLimiter(),
	async (ctx) => {
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
		log.log(`User ${user.id} registered`);

		ctx.response.status = 201;
		ctx.response.body = { key: session.publicID, user };
	},
);

// Log in
router.post(
	'/login',
	hasCredentials(),
	rateLimiter({ tag: 'login', rate: 2, initial: 10, max: 10 }),
	async (ctx) => {
		const body = await ctx.request.body({ type: 'json' }).value;
		const user = await User.getByUsername(body.username.trim());

		if (user === null) {
			ctx.response.status = 404;
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
			log.log(`User ${user.id} failed to log in, invalid password`);
			return;
		}

		const session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
		);

		log.log(`User ${user.id} logged in`);
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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
		} else {
			ctx.response.body = user;
		}
	},
);

// Get temporary cookie for requests without header support
router.get('/get-cookie', auth.authenticated(), async (ctx) => {
	await ctx.cookies.set('SID', ctx.request.headers.get('API-Key'), {
		httpOnly: true,
	});
	ctx.response.body = { message: 'Cookie set' };
	ctx.response.status = 200;
});

// Edit user
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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		const fields: string[] = [];
		if (body.password?.length) {
			await user.setPassword(body.password);
			fields.push('password');
		}
		if (await auth.test.hasPermissions(ctx, [PERMISSIONS.MANAGE_USERS])) {
			if (body.username?.length && body.username !== user.username) {
				user.username = body.username.trim();
				fields.push('username');
			}
			const permissions = +body.permissions;
			if (
				Number.isInteger(permissions) &&
				permissions !== user.permissions
			) {
				user.permissions = permissions;
				fields.push('permissions');
			}
		}

		log.log(
			`User ${user.id} edited: ${
				fields.join(', ') || 'No fields changed'
			}`,
		);
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

// Delete user currently logged in as
router.delete(
	'/me',
	accountsEnabled(),
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		const loans = await Loan.getByUser(user);
		if (loans.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'EXISTING_LOANS',
				message:
					'You have to return all loaned items to delete your account',
			};
			log.log(`Failed to delete user ${user.id} due to open loans`);
			return;
		}

		log.log(`Deleted user ${user.id}`);
		user.delete();
		ctx.response.body = user;
	},
);

export default router;
