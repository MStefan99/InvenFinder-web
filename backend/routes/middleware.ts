import { Context } from '../deps.ts';

type Next = () => Promise<unknown>;

export async function credentialsPresent(ctx: Context, next: Next) {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (body.username === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'Username must be provided',
			};
			return;
		} else if (body.password === undefined) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_PASSWORD',
				message: 'Password must be provided',
			};
			return;
		}

		await next();
	} catch (e) {
		console.error(e);

		ctx.response.status = 400;
		ctx.response.body = {
			error: 'NO_CREDENTIALS',
			message: 'Credentials must be provided',
		};
	}
}
