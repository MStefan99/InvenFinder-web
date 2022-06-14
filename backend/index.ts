import {Application, Router} from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import AuthRouter from './routes/auth.ts';

const app = new Application();
const router = new Router();

router.get('/', (ctx) => {
	ctx.response.body = 'Welcome!';
});

app.use(router.routes());
app.use(router.allowedMethods());  // Responds to OPTIONS and 405/501

app.use(AuthRouter.routes());
app.use(AuthRouter.allowedMethods());

app.listen({port: 3007});
