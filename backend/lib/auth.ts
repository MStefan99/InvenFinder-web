import {Context, Middleware} from 'https://deno.land/x/oak@v10.6.0/mod.ts';

import Session from './session.ts';
import User from './user.ts';


async function getSession(ctx: Context) {
	if (ctx.state.session) {
		return ctx.state.session;
	}

	const id = await ctx.cookies.get('SID') ?? ctx.request.headers.get('api-key');
	if (!id) {
		return null;
	}

	return ctx.state.session = await Session.getByPublicID(id);
}

async function getUser(ctx: Context) {
	if (ctx.state.user) {
		return ctx.state.user;
	}

	if (!ctx.state.session) {
		await getSession(ctx.request);
	}

	return ctx.state.user = await User.getByID(ctx.state.session.userID);
}

type Next = () => Promise<unknown>;


export default {
	test: {
		async authenticated(ctx: Context): Promise<boolean> {
			const session = await getSession(ctx.request);

			return !!session;
		},

		async permissions(ctx: Context, permissions: [number]): Promise<boolean> {
			const user = await getUser(ctx.request);

			return user.hasPermissions(permissions);
		}
	},

	authenticated(): Middleware {
		return async (ctx, next) => {
			if (!await this.test.authenticated(ctx)) {
				ctx.response.status = 401;
				ctx.response.body = {error: 'Not authenticated'};
			} else {
				next();
			}
		};
	},

	permissions(permissions: [number]): Middleware {
		return async (ctx, next) => {
			if (!await this.test.authenticated(ctx)) {
				ctx.response.status = 401;
				ctx.response.body = {error: 'Not authenticated'};
			} else if (!await this.test.permissions(ctx, permissions)) {
				ctx.response.status = 403;
				ctx.response.body = {error: 'Not authorized'};
			} else {
				next();
			}
		};
	},
};
