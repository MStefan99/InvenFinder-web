import { Context, Middleware } from '../deps.ts';

import Session from '../orm/session.ts';
import User from '../orm/user.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { getUserInfo } from './sso.ts';

const sessionRevalidationInterval = 1000 * 60 * 10;

async function getSession(ctx: Context): Promise<Session | null> {
	if (ctx.state.session) {
		return ctx.state.session;
	}

	const token = ctx.request.headers.get('api-key');
	const ssoName = ctx.request.headers.get('sso-name');

	if (token === null || token === undefined) {
		return null;
	}

	let session = await Session.getByToken(token);
	const now = new Date();
	if (
		session && ssoName &&
		now.getTime() - (session?.lastVerified?.getTime() ?? 0) >
			sessionRevalidationInterval
	) {
		const info = await getUserInfo(ssoName, token);

		if (info) {
			session.lastVerified = now;
			session.save();
		} else {
			session.delete(true);
			session = null;
		}
	}

	if (!session && ssoName) {
		const info = await getUserInfo(ssoName, token);
		if (!info) {
			return null;
		}

		const user = await User.getByUsername(info.username);
		if (!user) {
			return null;
		}

		session = await Session.create(
			user,
			ctx.request.ip,
			ctx.request.headers.get('user-agent') ?? 'Unknown',
			token,
			ssoName,
		);
	}

	if (session?.revoked) {
		return null;
	}

	return (ctx.state.session = session);
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

		async hasPermissions(
			ctx: Context,
			permissions: PERMISSIONS[],
			any?: boolean,
		): Promise<boolean> {
			const user = await getUser(ctx);

			return user?.hasPermissions(permissions, any) ?? false;
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

	hasPermissions(permissions: PERMISSIONS[], any?: boolean): Middleware {
		return async (ctx, next) => {
			if (!(await this.test.authenticated(ctx))) {
				ctx.response.status = 401;
				ctx.response.body = {
					error: 'NOT_AUTHENTICATED',
					message: 'You must sign in to do this',
				};
			} else if (
				!(await this.test.hasPermissions(ctx, permissions, any))
			) {
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
