import {Application, Router} from 'https://deno.land/x/oak/mod.ts';
import {Client} from 'https://deno.land/x/mysql/mod.ts';

const client = await new Client().connect({
	hostname: '127.0.0.1',
	username: 'root',
	db: 'dbname',
	password: 'password',
});

const router = new Router();
router.get('/', (ctx) => {
	ctx.response.body = `<!DOCTYPE html>
    <html lang="en">
      <head>
      <title>Hello oak!</title>
      </head>
      <body>
        <h1>Hello oak!</h1>
      </body>
    </html>
  `;
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({port: 3007});
