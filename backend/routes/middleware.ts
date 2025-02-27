import { Context, Middleware } from '../deps.ts';
import log from '../lib/log.ts';
import { toCSV } from '../../common/csv.ts';

async function getBodyLength(ctx: Context) {
	try {
		return (await ctx.request.body.text()).length;
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
			const body = await ctx.request.body.json();

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
		log.debug(
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
			ctx.response.headers.set(
				'Access-Control-Allow-Origin',
				ctx.request.headers.get('origin') ?? '*',
			);
		} else {
			const origin = Deno.env.get('CORS_ORIGIN');
			origin &&
				ctx.response.headers.set('Access-Control-Allow-Origin', origin);
		}

		ctx.response.headers.set('Access-Control-Allow-Credentials', 'true');
		ctx.response.headers.set(
			'Access-Control-Allow-Headers',
			ctx.request.headers.get('Access-Control-Request-Headers') ?? '*',
		);
		ctx.response.headers.set(
			'Access-Control-Allow-Methods',
			ctx.request.headers.get('Access-Control-Request-Method') ?? '*',
		);
		ctx.response.headers.set(
			'Access-Control-Expose-Headers',
			ctx.request.headers.get('Access-Control-Request-Headers') ?? '*',
		);
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
			if (ctx.response.body && typeof ctx.response.body === 'object') {
				ctx.response.body = toCSV(ctx.response.body);
			}
		}
	};
}
