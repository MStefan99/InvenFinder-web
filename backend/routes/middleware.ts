import { Context, Middleware } from '../deps.ts';
import log from '../lib/log.ts';

async function getBodyLength(ctx: Context) {
	try {
		return (await ctx.request.body({ type: 'text' }).value).length;
	} catch {
		return 0;
	}
}

function parseAccept(ctx: Context): { type: string; quality: number }[] {
	const accept = ctx.request.headers.get('Accept');
	if (!accept) {
		return [];
	} else {
		return accept
			.split(',')
			.map((entry) => {
				const [type, quality] = entry.split(';q=');
				return { type, quality: +quality || 1 };
			})
			.sort((type1, type2) => type2.quality - type1.quality);
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
		log.log(
			`${req.method} ${
				req.url.pathname + req.url.search
			} from ${req.ip} at ${start.getHours()}:${
				start.getMinutes().toString().padStart(2, '0')
			}:${start.getSeconds().toString().padStart(2, '0')} ` +
				`on ${start.getDay()}.${start.getMonth()}.${start.getFullYear()} - ${ctx.response.status} in ${
					Date.now() - start.getTime()
				} ms`,
		);
	};
}

export function cors(): Middleware {
	return async (ctx, next) => {
		if (Deno.env.get('ENV') === 'dev') {
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

export function csv(): Middleware {
	return async (ctx, next) => {
		await next();
		const types = parseAccept(ctx);

		if (types[0]?.type !== 'text/csv') {
			return;
		} else {
			const data = ctx.response.body;
			ctx.response.body = '';

			if (Array.isArray(data) && data.length) {
				const keys = Object.keys(data[0]);
				ctx.response.body += keys.join(',') + '\n';

				for (const el of data) {
					ctx.response.body += keys.map((key) =>
						`"${el[key].toString().replaceAll('"', '""')}"`
					).join(',') + '\n';
				}
			} else if (typeof data === 'object' && data !== null) {
				const keys = Object.keys(data);
				ctx.response.body += keys.join(',') + '\n';
				ctx.response.body += keys.map((key) =>
					`"${
						String(data[key as keyof typeof data]).replaceAll(
							'"',
							'""',
						)
					}"`
				).join(',') + '\n';
			}
		}
	};
}
