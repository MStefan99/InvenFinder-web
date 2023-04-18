import { Application, Router } from './deps.ts';
import { cors, csv, logger } from './routes/middleware.ts';
import authRouter from './routes/auth.ts';
import sessionRouter from './routes/sessions.ts';
import itemRouter from './routes/items.ts';
import userRouter from './routes/users.ts';
import { init } from './lib/init.ts';
import log from './lib/log.ts';
import rateLimiter from './lib/rateLimiter.ts';

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
const routers = [authRouter, sessionRouter, itemRouter, userRouter];

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
		log.error(err.stack);

		if (Deno.env.get('ENV') === 'dev') {
			ctx.response.body = {
				error: 'APP_ERROR',
				message: `Error: ${err.message}; Stack: ${err.stack}`,
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
		crashCourseURL: Deno.env.get('CRASH_COURSE_URL') ?? null,
		crashCourseKey: Deno.env.get('CRASH_COURSE_AUDIENCE_KEY') ?? null,
	};
});

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
