import { Context, Middleware } from '../deps.ts';

import Session from './session.ts';
import User from './user.ts';
import { PERMISSIONS } from '../../common/permissions.ts';

async function getSession(ctx: Context): Promise<Session | null> {
	if (ctx.state.session) {
		return ctx.state.session;
	}

	const id = ctx.request.headers.get('api-key') ??
		(await ctx.cookies.get('SID'));

	if (id === null || id === undefined) {
		return null;
	}

	return (ctx.state.session = await Session.getByPublicID(id));
}

async function getUser(ctx: Context): Promise<User | null> {
	if (ctx.state.user) {
		return ctx.state.user;
	}

	if (!ctx.state.session) {
		await getSession(ctx);
	}

	return (ctx.state.user = await User.getByID(ctx.state.session.userID));
}

export default {
	test: {
		async authenticated(ctx: Context): Promise<boolean> {
			const session = await getSession(ctx);

			return !!session;
		},

		async permissions(
			ctx: Context,
			permissions: [PERMISSIONS],
		): Promise<boolean> {
			const user = await getUser(ctx);

			return user?.hasPermissions(permissions) ?? false;
		},
	},

	methods: {
		getSession,
		getUser,
	},

	authenticated(): Middleware {
		return async (ctx, next) => {
			if (!(await this.test.authenticated(ctx))) {
				ctx.response.status = 401;
				ctx.response.body = {
					error: 'NOT_AUTHENTICATED',
					message: 'You must sign in to do this',
				};
			} else {
				await next();
			}
		};
	},

	permissions(permissions: [PERMISSIONS]): Middleware {
		return async (ctx, next) => {
			if (!(await this.test.authenticated(ctx))) {
				ctx.response.status = 401;
				ctx.response.body = {
					error: 'NOT_AUTHENTICATED',
					message: 'You must sign in to do this',
				};
			} else if (!(await this.test.permissions(ctx, permissions))) {
				ctx.response.status = 403;
				ctx.response.body = {
					error: 'NOT_AUTHORIZED',
					message: 'You are not allowed to do this',
				};
			} else {
				await next();
			}
		};
	},
};
