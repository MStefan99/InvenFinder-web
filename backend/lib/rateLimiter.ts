import { Context, Middleware } from '../deps.ts';

const maxAge = 1000 * 60 * 60;
const pruneInterval = 1000 * 60;

type Bucket = {
	tokens: number;
	modified: number;
};

type Options = {
	rate: number; // How many new tokens per minute
	initial: number; // How many tokens each bucket has when created
	max: number; // Maximum amount of tokens
	min: number; // Minimum amount of tokens
	tag: string | null; // A simple string value to separate different actions
	id: (ctx: Context) => string | undefined | Promise<string | undefined>; // Context property to be used as a bucket id
	action: ((ctx: Context) => unknown) | null; // A callback to be run when rate exceeded
};

const buckets = new Map<string, Bucket>();
const defaults: Options = {
	rate: 100,
	initial: 50,
	max: 100,
	min: -10,
	tag: 'default',
	id: (ctx) => ctx.request.ip,
	action: null,
};

function clamp(val: number, min: number, max: number) {
	return val < min ? min : val > max ? max : val;
}

setInterval(() => {
	const now = Date.now();
	for (const [id, bucket] of buckets.entries()) {
		if (now - bucket.modified > maxAge) {
			buckets.delete(id);
		}
	}
}, pruneInterval);

export function rateLimiter(options?: Partial<Options>): Middleware {
	const opts = Object.assign({}, defaults, options);

	return async (ctx, next) => {
		const clientID = await opts.id(ctx) ?? 'null';
		if (typeof clientID !== 'string') {
			throw new Error('Rate limiting id must be a string');
		}

		const id = opts.tag + ':' + clientID;
		let bucket = buckets.get(id);

		if (!bucket) {
			bucket = {
				tokens: opts.initial,
				modified: Date.now(),
			};
			buckets.set(id, bucket);
		}

		bucket.tokens += Math.floor(
			(Date.now() - bucket.modified) / 1000 / 60 * opts.rate,
		);
		bucket.modified = Date.now();
		const tokens = bucket.tokens;
		bucket.tokens = clamp(bucket.tokens - 1, opts.min, opts.max);

		if (tokens > 0) {
			ctx.response.headers.set(
				'RateLimit-Limit',
				bucket.tokens.toString(),
			);
			ctx.response.headers.set(
				'RateLimit-Policy',
				opts.rate.toString() + ';w=60',
			);
			await next();
		} else {
			const delay = Math.ceil(
				(1 - bucket.tokens) * 60 / opts.rate,
			);

			ctx.response.headers.set('Retry-After', delay.toString());
			if (opts.action) {
				await opts.action(ctx);
			}
			ctx.response.status = 429;
			ctx.response.body = {
				error: 'RATE_LIMITED',
				message:
					'You\'ve made too many requests in a short amount of time, please try again in ' +
					delay + ' second(s)',
			};
		}
	};
}

export default rateLimiter;
