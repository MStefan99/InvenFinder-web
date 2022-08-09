import { Context } from '../deps.ts';

type Next = () => Promise<unknown>;

export async function credentialsPresent(ctx: Context, next: Next) {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.username === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'No username',
			};
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_PASSWORD',
				message: 'No password',
			};
			return;
		}

		await next();
	} catch {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message: 'Invalid request body',
		};
	}
}
