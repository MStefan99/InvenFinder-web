import { Context } from '../deps.ts';

type Next = () => Promise<unknown>;

export async function credentialsPresent(ctx: Context, next: Next) {
	try {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (!body.username?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_USERNAME',
				message: 'Username must be provided',
			};
			return;
		} else if (!body.password.length) {
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

export async function logger(ctx: Context, next: Next) {
	const start = Date.now();
	await next();
	const req = ctx.request;
	console.log(
		`${req.method} ${req.url.pathname + req.url.search} from ${req.ip} on ${
			new Date().toLocaleString()
		} - ${ctx.response.status} in ${Date.now() - start} ms`,
	);
}

export async function cors(ctx: Context, next: Next) {
	if (Deno.env.get('ENV') === 'development') {
		ctx.response.headers.set('Access-Control-Allow-Origin', '*');
	} else {
		const origin = Deno.env.get('CORS_ORIGIN');
		origin &&
			ctx.response.headers.set('Access-Control-Allow-Origin', origin);
	}

	ctx.response.headers.set('Access-Control-Allow-Headers', '*');
	ctx.response.headers.set('Access-Control-Allow-Methods', '*');
	ctx.response.headers.set('Access-Control-Expose-Headers', '*');
	ctx.response.headers.set('Access-Control-Max-Age', '86400');

	ctx.response.status = 200;

	await next();
}
