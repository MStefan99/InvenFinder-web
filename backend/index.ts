import { Application, Router } from './deps.ts';
import authRouter from './routes/auth.ts';
import sessionRouter from './routes/sessions.ts';
import itemRouter from './routes/items.ts';
import userRouter from './routes/users.ts';

const port = 3007;

const app = new Application();
const apiRouter = new Router({
	prefix: '/api',
});

app.use(async (ctx, next) => {
	ctx.response.headers.set('Who-Am-I', 'Invenfinder');
	await next();
});

if (Deno.env.get('ENV') === 'development') {
	app.use(async (ctx, next) => {
		ctx.response.headers.set('Access-Control-Allow-Origin', '*');
		ctx.response.headers.set('Access-Control-Allow-Methods', '*');
		ctx.response.headers.set('Access-Control-Allow-Headers', '*');
		ctx.response.headers.set('Access-Control-Expose-Headers', '*');
		ctx.response.headers.set('Access-Control-Max-Age', '86400');

		if (ctx.request.method === 'OPTIONS') {
			ctx.response.status = 200;
		}
		await next();
	});
}

apiRouter.get('/', (ctx) => {
	ctx.response.body = { message: 'Welcome!' };
});

app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods()); // Responds to OPTIONS and 405/501

apiRouter.use(authRouter.routes());
apiRouter.use(authRouter.allowedMethods());

apiRouter.use(sessionRouter.routes());
apiRouter.use(sessionRouter.allowedMethods());

apiRouter.use(itemRouter.routes());
apiRouter.use(itemRouter.allowedMethods());

apiRouter.use(userRouter.routes());
apiRouter.use(userRouter.allowedMethods());

app.use((ctx) => {
	ctx.response.status = 404;
	ctx.response.body = { error: 'Route not found', code: 'NOT_FOUND' };
});

app.listen({ port }).then(() => {
	console.log('Deno listening at http://localhost:' + port);
});
