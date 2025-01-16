import { Middleware, path, Router, send } from '../deps.ts';

import auth from '../lib/auth.ts';
import Item from '../orm/item.ts';
import Loan from '../orm/loan.ts';
import { PERMISSIONS } from '../../common/permissions.ts';
import { hasBody } from './middleware.ts';
import rateLimiter from '../lib/rateLimiter.ts';
import log from '../lib/log.ts';

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
		const boolean = ctx.request.url.searchParams.get('boolean');

		if (query?.length) {
			ctx.response.body = await Item.search(query, !!boolean);
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
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
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
			ctx.response.status = 404;
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
	auth.hasPermissions([PERMISSIONS.LOAN_ITEMS]),
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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		const user = await auth.methods.getUser(ctx);
		if (user === null) {
			ctx.response.status = 404;
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
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body.json();

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

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} created item ${item?.id}`,
		);
		ctx.response.status = 201;
		ctx.response.body = item;
	},
);

// Upload file for an item
router.post(
	'/:id/files',
	uploadsEnabled(),
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
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
		const body = await ctx.request.body.formData();
		const files = Array.from(body.values()).filter((f) =>
			f instanceof File
		);

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		if (!files?.length) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'NO_FILES',
				message:
					'No files were uploaded, please select at least one file and try again',
			};
			return;
		}

		const fileNames = item.link?.split('\n') ?? [];

		for (const file of files) {
			const itemDir = path.join(uploadDir, ctx.params.id);
			const filePath = path.join(itemDir, file.name);
			await Deno.mkdir(itemDir, { recursive: true });
			await Deno.writeFile(filePath, file.stream());
			fileNames.push('file:' + path.basename(file.name));
		}

		item.link = fileNames.join('\n');
		item.save();

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} uploaded the following files for item ${item?.id}: ${
				files.map((f) => f.name).join(', ')
			}`,
		);

		ctx.response.status = 203;
		ctx.response.body = item.link;
	},
);

// Get file for an item
router.get(
	'/:id/files/:file',
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
	const body = await ctx.request.body.json();

	const id = +ctx.params.id;
	if (!Number.isInteger(id)) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_ID',
			message: 'ID must be a number',
		};
		return;
	}

	if (!Number.isInteger(body.amount) && body.amount < 1) {
		ctx.response.status = 400;
		ctx.response.body = {
			error: 'INVALID_AMOUNT',
			message: 'Amount must be a positive number',
		};
		return;
	}

	const user = await auth.methods.getUser(ctx);
	if (user === null) {
		ctx.response.status = 404;
		ctx.response.body = {
			error: 'USER_NOT_FOUND',
			message: 'User was not found',
		};
		return;
	}

	const item = await Item.getByID(id);
	if (item === null) {
		ctx.response.status = 404;
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

	log.log(`User ${user.id} submitted a loan request for item ${item.id}`);
	ctx.response.status = 201;
	ctx.response.body = { ...loan, username: user.username };
});

// Change item amount
router.put(
	'/:id/amount',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT]),
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

		const body = await ctx.request.body.json();
		if (!Number.isInteger(body.amount) && body.amount < 1) {
			ctx.response.status = 400;
			ctx.response.body = {
				error: 'INVALID_AMOUNT',
				message: 'Amount must be a non-negative number',
			};
			return;
		}

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		item.amount = body.amount;
		item.save();

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} changed amount of item ${item.id}`,
		);
		ctx.response.body = item;
	},
);

// Edit item
router.patch(
	'/:id',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
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
		const body = await ctx.request.body.json();

		const item = await Item.getByID(id);
		if (item === null) {
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		const fields: string[] = [];
		const amount = +body.amount;
		if (body.amount !== undefined && body.amount !== item.amount) {
			if (!Number.isInteger(amount) || amount < 0) {
				ctx.response.status = 400;
				ctx.response.body = {
					error: 'INVALID_AMOUNT',
					message: 'Amount must be a non-negative number',
				};
				return;
			}
			item.amount = amount;
			fields.push('amount');
		}

		if (body.name?.length && body.name !== item.name) {
			item.name = body.name.trim();
			fields.push('name');
		}
		if (
			body.description !== undefined &&
			body.description !== item.description
		) {
			item.description = body.description?.trim() ?? null;
			fields.push('description');
		}
		if (body.link !== undefined && body.link !== item.link) {
			const links = body.link?.split('\n') as string[] ?? [];
			if (item.link?.match(/^file:/)) {
				const files = await Deno.readDir(
					path.join(uploadDir, item.id.toString()),
				);
				for await (const file of files) {
					if (!links.some((l) => l.match(file.name))) {
						await Deno.remove(
							path.join(uploadDir, item.id.toString(), file.name),
						);
					}
				}
			}
			item.link = body.link?.trim() ?? null;
			fields.push('link');
		}
		if (body.location?.length && body.location !== item.location) {
			item.location = body.location.trim();
			fields.push('location');
		}

		item.save();

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} edited item ${item.id}: ${
				fields.join(', ') || 'No fields changed'
			}`,
		);
		ctx.response.body = item;
	},
);

// Delete item
router.delete(
	'/:id',
	hasBody(),
	auth.hasPermissions([PERMISSIONS.MANAGE_ITEMS]),
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
			ctx.response.status = 404;
			ctx.response.body = {
				error: 'ITEM_NOT_FOUND',
				message: 'Item was not found',
			};
			return;
		}

		item.delete();

		log.log(
			`User ${
				(await auth.methods.getUser(ctx))
					?.id
			} deleted item ${item.id}`,
		);
		ctx.response.body = item;
	},
);

export default router;
