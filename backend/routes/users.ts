import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import { parsePermissions, PERMISSIONS } from '../../common/permissions.ts';
import User from '../lib/user.ts';

const router = new Router({
	prefix: '/users',
});

// Get a list of all users
router.get('/', auth.permissions([PERMISSIONS.MANAGE_USERS]), async (ctx) => {
	const users = await User.getAll();

	ctx.response.status = 200;
	ctx.response.body = users;
});

// Get a user by ID
router.get(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_USERS]),
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
			ctx.response.status = 400;
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
	auth.permissions([PERMISSIONS.MANAGE_USERS]),
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
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = user;
	},
);

// Add a new user
router.post('/', auth.permissions([PERMISSIONS.MANAGE_USERS]), async (ctx) => {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;
		if (!body.username?.length) {
			ctx.response.status = 400;
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

		ctx.response.status = 201;
		ctx.response.body = user;
	} catch (e) {
		console.error(e);
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message:
				'Could not process your request, please check for errors and retry',
		};
	}
});

// Edit user
router.patch(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_USERS]),
	async (ctx) => {
		try {
			const body = await ctx.request.body({ type: 'json' }).value;
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
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'USER_NOT_FOUND',
					message: 'User was not found',
				};
				return;
			}

			if (body.username?.length) {
				user.username = body.username.trim();
			}
			if (body.password?.length) {
				await user.setPassword(body.password);
			}
			const permissions = +body.permissions;
			if (Number.isInteger(permissions)) {
				user.permissions = permissions;
			}

			await user.save();

			ctx.response.status = 200;
			ctx.response.body = user;
		} catch (e) {
			console.error(e);

			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message:
					'Could not process your request, please check for errors and retry',
			};
		}
	},
);

// Delete user
router.delete(
	'/:id',
	auth.permissions([PERMISSIONS.MANAGE_USERS]),
	async (ctx) => {
		try {
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
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'USER_NOT_FOUND',
					message: 'User was not found',
				};
				return;
			}

			user.delete();

			ctx.response.status = 200;
			ctx.response.body = user;
		} catch (e) {
			console.error(e);

			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_REQUEST',
				message:
					'Could not process your request, please check for errors and retry',
			};
		}
	},
);

export default router;
