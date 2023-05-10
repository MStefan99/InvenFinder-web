import { Middleware, path, Router, send } from '../deps.ts';

import auth from '../lib/auth.ts';
import Item from '../orm/item.ts';
import Loan from '../orm/loan.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { hasBody } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';

const router = new Router({
	prefix: '/items',
});
const uploadDir = Deno.env.get('UPLOAD_DIR') ??
	path.join(path.fromFileUrl(import.meta.url), '../../upload');

function uploadsEnabled(): Middleware {
	if (Deno.env.has('NO_UPLOADS')) {
		return (ctx, _next) => {
			ctx.response.status = 422;
			ctx.response.body = {
				error: 'UPLOADS_DISABLED',
				message:
					'File uploads are disabled for this Invenfinder installation',
			};
			return;
		};
	} else {
		return async (_ctx, next) => {
			await next();
		};
	}
}

// Get all items
router.get(
	'/',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const query = ctx.request.url.searchParams.get('q');

		if (query?.length) {
			ctx.response.body = await Item.search(query);
			return;
		}

		ctx.response.body = await Item.getAll();
	},
);

// Get item by ID
router.get(
	'/:id',
	auth.authenticated(),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const id = +ctx.params.id;

		if (Number.isNaN(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ID_NAN',
				message: 'ID must be a number',
			};
			return;
		}

		ctx.response.body = await Item.getByID(id);
	},
);

// Get item loans
router.get(
	'/:id/loans',
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		const id = +ctx.params.id;

		if (Number.isNaN(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ID_NAN',
				message: 'ID must be a number',
			};
			return;
		}

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		ctx.response.body = await Loan.getByItem(item);
	},
);

// Get item loans by user
router.get(
	'/:id/loans/mine',
	auth.permissions([PERMISSIONS.LOAN_ITEMS]),
	async (ctx) => {
		const id = +ctx.params.id;

		if (Number.isNaN(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ID_NAN',
				message: 'ID must be a number',
			};
			return;
		}

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 500;
			ctx.response.body = {
				error: 'USER_NOT_FOUND',
				message: 'User was not found',
			};
			return;
		}

		ctx.response.body = await Loan.getByItemAndUser(item, user);
	},
);

// Add item
router.post(
	'/',
	hasBody(),
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body({ type: 'json' }).value;

		if (!body.name.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_NAME',
				message: 'Name must be provided',
			};
			return;
		}
		if (!body.location.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_LOCATION',
				message: 'Location must be provided',
			};
			return;
		}
		if (body.amount === undefined || +body.amount < 0) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'Amount must be a positive number',
			};
			return;
		}

		const item = await Item.create({
			name: body.name.trim(),
			description: body.description?.trim() ?? null,
			link: body.link?.trim() ?? null,
			location: body.location.trim(),
			amount: +body.amount,
		});

		ctx.response.status = 201;
		ctx.response.body = item;
	},
);

// Upload file for an item
router.post(
	'/:id/upload',
	uploadsEnabled(),
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	async (ctx) => {
		const id = +ctx.params.id;
		if (!Number.isInteger(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_ID',
				message: 'ID must be a number',
			};
			return;
		}
		const body = await ctx.request.body({ type: 'form-data' }).value.read({
			maxFileSize: 25 * 1024 * 1024,
		});

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		const files = body.files?.filter((f) => f.originalName);
		if (!files?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_FILES',
				message:
					'No files were uploaded, please select at least one file and try again',
			};
			return;
		}

		try {
			await Deno.remove(path.join(uploadDir, item.id.toString()), {
				recursive: true,
			});
		} catch {
			// Nothing to do here
		}

		const fileNames = [];
		for (const file of files) {
			const itemDir = path.join(uploadDir, ctx.params.id);
			const filePath = path.join(itemDir, file.originalName);
			if (!file.filename) {
				continue; // If failed to write to disk
			}
			await Deno.mkdir(itemDir, { recursive: true });
			await Deno.rename(file.filename, filePath);
			fileNames.push('file:' + path.basename(file.originalName));
		}

		const savedFile = files.find((f) => f.filename);
		savedFile?.filename &&
			await Deno.remove(path.dirname(savedFile.filename), {
				recursive: true,
			});

		item.link = fileNames.join('\n');
		item.save();

		ctx.response.status = 303;
		ctx.response.headers.set(
			'Location',
			ctx.request.headers.get('Origin') + '/items/' + id,
		);
	},
);

// Get file for an item
router.get(
	'/:id/upload/:file',
	uploadsEnabled(),
	auth.authenticated(),
	async (ctx) => {
		await send(ctx, path.join(ctx.params.id, ctx.params.file), {
			root: uploadDir,
		});
	},
);

// Place a loan request
router.post('/:id/loans', hasBody(), auth.authenticated(), async (ctx) => {
	const body = await ctx.request.body({ type: 'json' }).value;

	const id = +ctx.params.id;
	if (!Number.isInteger(id)) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_ID',
			message: 'ID must be a number',
		};
		return;
	}

	const user = await auth.methods.getUser(ctx);
	if (user === null) {
		ctx.response.status = 500;
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User was not found',
		};
		return;
	}

	const item = await Item.getByID(id);
	if (item === null) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'ITEM_NOT_FOUND',
			message: 'Item was not found',
		};
		return;
	}

	const amount = +body.amount;
	const loan = await Loan.create({
		userID: user.id,
		itemID: item.id,
		amount: amount,
	});

	ctx.response.status = 201;
	ctx.response.body = { ...loan, username: user.username };
});

// Change item amount
router.put(
	'/:id/amount',
	hasBody(),
	auth.permissions([PERMISSIONS.EDIT_ITEM_AMOUNT]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const id = +ctx.params.id;
		if (!Number.isInteger(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_ID',
				message: 'ID must be a number',
			};
			return;
		}

		const body = await ctx.request.body({ type: 'json' }).value;
		if (body.amount === undefined || +body.amount < 0) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'Amount must be a positive number',
			};
			return;
		}

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		item.amount = body.amount;
		item.save();

		ctx.response.body = item;
	},
);

// Edit item
router.patch(
	'/:id',
	hasBody(),
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const id = +ctx.params.id;
		if (!Number.isInteger(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_ID',
				message: 'ID must be a number',
			};
			return;
		}
		const body = await ctx.request.body({ type: 'json' }).value;

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		const amount = +body.amount;
		if (body.amount !== undefined) {
			if (!Number.isInteger(amount) || amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Amount must be a positive number',
				};
				return;
			}
		}

		if (body.name?.length) {
			item.name = body.name.trim();
		}
		if (body.description !== undefined) {
			item.description = body.description?.trim() ?? null;
		}
		if (body.link !== undefined) {
			if (item.link?.match(/^file:/)) {
				await Deno.remove(path.join(uploadDir, item.id.toString()), {
					recursive: true,
				});
			}
			item.link = body.link?.trim() ?? null;
		}
		if (body.location?.length) {
			item.location = body.location.trim();
		}
		if (body.amount !== undefined) {
			item.amount = amount;
		}

		item.save();

		ctx.response.body = item;
	},
);

// Delete item
router.delete(
	'/:id',
	hasBody(),
	auth.permissions([PERMISSIONS.MANAGE_ITEMS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const id = +ctx.params.id;
		if (!Number.isInteger(id)) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_ID',
				message: 'ID must be a number',
			};
			return;
		}

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		item.delete();

		ctx.response.body = item;
	},
);

export default router;
