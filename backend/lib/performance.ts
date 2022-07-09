import { Context } from 'https://deno.land/x/oak@v10.6.0/context.ts';

type Timestamp = {
	name: string;
	dur: number;
};

function perf() {
	return async function middleware(
		ctx: Context,
		next: () => Promise<unknown>,
	) {
		ctx.state.perf = {
			start: performance.now(),
			timestamps: [] as Timestamp[],
		};

		await next();

		ctx.state.perf.end = performance.now();
		ctx.response.headers.set(
			'Server-Timing',
			ctx.state.perf.timestamps.reduce(
				(prev: string, val: Timestamp): string => {
					console.log(val.dur);
					return prev + ',' + val.name + ';dur=' + val.dur;
				},
				'total;dur=' + (ctx.state.perf.end - ctx.state.perf.start),
			),
		);
	};
}

perf.add = function (ctx: Context, name: string, dur: number) {
	const t = ctx.state.perf.timestamps.find((t: Timestamp) => t.name === name);

	if (t !== undefined) {
		t.dur += dur;
	} else {
		ctx.state.perf.timestamps.push({ name, dur });
	}
};

export default perf;
