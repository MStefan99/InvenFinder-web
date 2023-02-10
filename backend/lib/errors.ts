import { Context } from '../deps.ts';

export async function handleErrors(ctx: Context, cb: () => void) {
	try {
		await cb();
	} catch (e) {
		console.error(e);
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_REQUEST',
			message:
				'Could not process your request, please check for errors and retry',
		};
	}
}
