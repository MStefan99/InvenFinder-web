import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import { parsePermissions, PERMISSIONS } from '../../common/permissions.ts';
import User from '../orm/user.ts';
import { hasBody } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';
import Loan from '../orm/loan.ts';
import log from '../lib/log.ts';

const router = new Router({
	prefix: '/users',
});

// Get a list of all users
router.get(
	'/',
	auth.hasPermissions(
		[PERMISSIONS.MANAGE_ITEMS, PERMISSIONS.MANAGE_USERS],
		true,
	),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		ctx.response.body = await User.getAll();
	},
);

// Get a user by ID
router.get(
	'/:id',
	auth.hasPermissions(
		[PERMISSIONS.MANAGE_ITEMS, PERMISSIONS.MANAGE_USERS],
		true,
	),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		if (!ctx.params.id?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_ID',
				message: 'ID must be provided',
			};
			return;
		}

		const user = await User.getByID(+ctx.params.id);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = user;
	},
);

// Get a user by username
router.get(
	'/username/:username',
	auth.hasPermissions([PERMISSIONS.MANAGE_USERS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		if (!ctx.params.username?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'Username must be provided',
			};
			return;
		}

		const user = await User.getByUsername(ctx.params.username);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = user;
	},
);

// Get user loans
router.get(
	'/:id/loans',
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		if (!ctx.params.id?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_ID',
				message: 'ID must be provided',
			};
			return;
		}

		const user = await User.getByID(+ctx.params.id);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = await Loan.getByUser(user);
	},
);

// Add a new user
router.post(
	'/',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_USERS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body.json();
		if (!body.username?.length) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'Username must be provided',
			};
			return;
		}
		if (!body.password?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_PASSWORD',
				message: 'Password must be provided',
			};
			return;
		}

		const user = await User.create(
			body.username.trim(),
			body.password,
			parsePermissions(body.permissions),
		);

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} registered user ${user.id}`,
		);
		ctx.response.status = 201;
		ctx.response.body = user;
	},
);

// Edit user
router.patch(
	'/:id',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_USERS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body.json();
		if (!ctx.params.id?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_ID',
				message: 'ID must be provided',
			};
			return;
		}

		const user = await User.getByID(+ctx.params.id);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		const fields: string[] = [];
		if (body.username?.length && body.username !== user.username) {
			user.username = body.username.trim();
			fields.push('username');
		}
		if (body.password?.length) {
			await user.setPassword(body.password);
			fields.push('password');
		}
		const permissions = +body.permissions;
		if (
			Number.isInteger(permissions) &&
			body.permissions !== user.permissions
		) {
			user.permissions = permissions;
			fields.push('permissions');
		}

		await user.save();

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} edited user ${user.id}: ${
				fields.join(', ') || 'No fields changed'
			}`,
		);
		ctx.response.body = user;
	},
);

// Delete user
router.delete(
	'/:id',
	auth.hasPermissions([PERMISSIONS.MANAGE_USERS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		if (!ctx.params.id?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_ID',
				message: 'ID must be provided',
			};
			return;
		}

		const user = await User.getByID(+ctx.params.id);
		if (user === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		user.delete();
		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} deleted user ${user.id}`,
		);
		ctx.response.body = user;
	},
);

export default router;
