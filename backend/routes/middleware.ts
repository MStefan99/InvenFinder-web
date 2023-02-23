import { Context, Middleware } from '../deps.ts';

async function getBodyLength(ctx: Context) {
	try {
		return (await ctx.request.body({ type: 'text' }).value).length;
	} catch {
		return 0;
	}
}

export function hasBody(): Middleware {
	return async (ctx, next) => {
		if (await getBodyLength(ctx)) {
			await ctx.request.body().value;
			await next();
		} else {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_BODY',
				message:
					'Required information must be provided in the request body',
			};
		}
	};
}

export function hasCredentials(): Middleware {
	return async (ctx, next) => {
		if (await getBodyLength(ctx)) {
			const body = await ctx.request.body({ type: 'json' }).value;

			if (!body.username?.length) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'NO_USERNAME',
					message: 'Username must be provided',
				};
				return;
			} else if (!body.password?.length) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'NO_PASSWORD',
					message: 'Password must be provided',
				};
				return;
			}

			await next();
		} else {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_CREDENTIALS',
				message: 'Credentials must be provided',
			};
		}
	};
}

export function logger(): Middleware {
	return async (ctx, next) => {
		const start = new Date();
		await next();
		const req = ctx.request;
		console.log(
			`${req.method} ${
				req.url.pathname + req.url.search
			} from ${req.ip} at ${start.getHours()}:${start.getMinutes()}:${start.getSeconds()} ` +
				`on ${start.getDay()}.${start.getMonth()}.${start.getFullYear()} - ${ctx.response.status} in ${
					Date.now() - start.getTime()
				} ms`,
		);
	};
}

export function cors(): Middleware {
	return async (ctx, next) => {
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

		await next();
	};
}
