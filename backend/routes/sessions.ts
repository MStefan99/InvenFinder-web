import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import Session from '../lib/session.ts';
import rateLimiter from '../lib/rateLimiter.ts';

const router = new Router({
	prefix: '/sessions',
});

// Get sessions
router.get(
	'/',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = await Session.getUserSessions(user);
	},
);

// Log out other session
router.delete(
	'/:id',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const currentSession = await auth.methods.getSession(ctx);
		const otherSession = await Session.getByPublicID(ctx.params.id);

		if (currentSession === null || otherSession === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'SESSION_NOT_FOUND',
				message: 'Session was not found',
			};
			return;
		}

		if (currentSession.userID !== otherSession.userID) {
			ctx.response.status = 403;
			ctx.response.body = {
				error: 'NOT_AUTHORIZED',
				message: 'You are not allowed to do this',
			};
			return;
		}

		otherSession.delete();

		ctx.response.body = otherSession;
	},
);

// Log out all sessions
router.delete(
	'/',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		Session.deleteAllUserSessions(user);

		ctx.response.body = { message: 'OK' };
	},
);

export default router;
