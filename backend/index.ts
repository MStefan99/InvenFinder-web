import { Application, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import authRouter from './routes/auth.ts';
import itemRouter from './routes/items.ts';

const app = new Application();
const apiRouter = new Router({
	prefix: '/api',
});

app.use(async (ctx, next) => {
	ctx.response.headers.set('Who-Am-I', 'Invenfinder');
	await next();
});

if (Deno.env.get('env') === 'development') {
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

apiRouter.use(itemRouter.routes());
apiRouter.use(itemRouter.allowedMethods());

app.use((ctx) => {
	ctx.response.status = 404;
	ctx.response.body = { error: 'Route not found', code: 'NOT_FOUND' };
});

app.listen({ port: 3007 });
