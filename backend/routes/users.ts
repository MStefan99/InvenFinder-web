import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import { parsePermissions, PERMISSIONS } from '../../common/permissions.ts';
import User from '../lib/user.ts';

const router = new Router({
	prefix: '/users',
});

// Edit another user
router.patch(
	'/:username',
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

export default router;
