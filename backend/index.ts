import { Application, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import authRouter from './routes/auth.ts';
import itemRouter from './routes/items.ts';

const app = new Application();
const apiRouter = new Router({
	prefix: '/api',
});

if (Deno.env.get('env') === 'development') {
	apiRouter.use(async (ctx, next) => {
		ctx.response.headers.set('Access-Control-Allow-Origin', '*');
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

app.listen({ port: 3007 });
