import { Application, Router } from './deps.ts';
import { cors, csv, logger } from './routes/middleware.ts';
import authRouter from './routes/auth.ts';
import sessionRouter from './routes/sessions.ts';
import itemRouter from './routes/items.ts';
import userRouter from './routes/users.ts';
import loanRouter from './routes/loans.ts';
import { init } from './lib/init.ts';
import log from './lib/log.ts';
import rateLimiter from './lib/rateLimiter.ts';
import { ssoProviders } from './lib/sso.ts';
import auth from './lib/auth.ts';
import Item from './orm/item.ts';

type ImportedItem = {
	name: string;
	amount: number;
	foundItem?: Item;
};

const defaultPort = 3007;
const parsedPort = Deno.env.has('PORT')
	? +(Deno.env.get('PORT') as string) // Safe because of the check above
	: defaultPort;
const port =
	Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65535
		? parsedPort
		: defaultPort;

const app = new Application();
const apiRouter = new Router();
const routers = [authRouter, sessionRouter, itemRouter, userRouter, loanRouter];

app.use(logger());
app.use(cors());
app.use(csv());

app.use(rateLimiter(), async (ctx, next) => {
	ctx.response.headers.set('Who-Am-I', 'Invenfinder');
	await next();
});

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		ctx.response.status = 500;
		log.error(
			`Error: ${(err as Error).message}; Stack: ${
				(err as Error)?.stack ?? 'not available'
			}`,
		);

		if (Deno.env.get('ENV') === 'dev') {
			ctx.response.body = {
				error: 'APP_ERROR',
				message: `Error: ${(err as Error).message}; Stack: ${
					(err as Error)?.stack ?? 'not available'
				}`,
			};
		} else {
			ctx.response.body = {
				error: 'APP_ERROR',
				message: 'An error occurred while processing your request',
			};
		}
	}
});

apiRouter.get('/', (ctx) => {
	ctx.response.body = { message: 'Welcome!' };
});

apiRouter.get('/settings', (ctx) => {
	ctx.response.body = {
		crashCourse: {
			url: Deno.env.get('CRASH_COURSE_URL') ?? null,
			key: Deno.env.get('CRASH_COURSE_AUDIENCE_KEY') ?? null,
		},
		features: {
			accounts: !Deno.env.get('NO_ACCOUNTS'),
			uploads: !Deno.env.get('NO_UPLOADS'),
			loans: !Deno.env.get('NO_LOANS'),
		},
		ssoProviders: Array.from(ssoProviders.values()),
	};
});

// Check if enough items are present
apiRouter.post(
	'/check',
	rateLimiter({
		tag: 'user',
		id: async (ctx) => (await auth.methods.getSession(ctx))?.id?.toString(),
	}),
	async (ctx) => {
		const body = await ctx.request.body.formData();
		const files = Array.from(body.values()).filter((f) =>
			f instanceof File
		);

		if (!files.length) {
			console.error('No files uploaded');
		}

		const text = await files[0].text();
		const importedItems = parseItems(text);

		ctx.response.status = 200;
		ctx.response.body = new ReadableStream<string>({
			async start(controller) {
				for (const importedItem of importedItems) {
					const item = (await Item.search(
						importedItem.name.replace(/(\d+\w*)R|Ω/, '$1Ohm'),
					))[0];
					item && (importedItem.foundItem = item);
					controller.enqueue(JSON.stringify(importedItem) + '\n');
				}
				controller.close();
			},
		});
	},
);

function parseItems(
	str: string,
	lineSeparator = '\n',
): ImportedItem[] {
	const items: ImportedItem[] = [];
	const columns = {
		name: {
			index: -1,
			vocabulary: ['name', 'value'],
		},
		amount: {
			index: -1,
			vocabulary: ['amount', 'count', 'quantity', 'qty'],
		},
	};

	for (const line of str.split(lineSeparator).filter((l) => l.length)) {
		const words = Array.from(line.matchAll(/".*?"/g), (m) => m[0]).map(
			(w) => w.replace(/['"]+/g, ''),
		);

		if (columns.name.index >= 0 && columns.amount.index >= 0) {
			items.push({
				name: words[columns.name.index],
				amount: +words[columns.amount.index],
			});
			continue;
		}

		for (const column in columns) {
			for (
				const [i, word] of words.map((w) => w.toLowerCase()).entries()
			) {
				if (
					columns[column as keyof typeof columns].vocabulary.includes(
						word,
					)
				) {
					columns[column as keyof typeof columns].index = i;
				}
			}
		}
	}

	return items;
}

app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods()); // Responds to OPTIONS and 405/501

for (const router of routers) {
	apiRouter.use(router.routes());
	apiRouter.use(router.allowedMethods());
}

app.use(rateLimiter(), (ctx) => {
	ctx.response.status = 404;
	ctx.response.body = {
		error: 'NOT_FOUND',
		message: 'Route not found',
	};
});

init().then(() => {
	log.log('Starting Oak server...');

	app.listen({ port }).then(() => {
		log.log('Listening at http://localhost:' + port);
	});
});

function exit() {
	log.log('Shutting down...');
	Deno.exit();
}

try {
	Deno.addSignalListener('SIGTERM', exit);
} catch {
	Deno.addSignalListener('SIGINT', exit);
}
