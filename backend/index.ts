import {Application, Router} from "https://deno.land/x/oak/mod.ts";

const router = new Router();
router.get("/", (ctx) => {
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

app.listen({port: 8080});
