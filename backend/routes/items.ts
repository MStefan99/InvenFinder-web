import { Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

const router = new Router({
	prefix: '/items',
});

router.get('/', (ctx) => {
	ctx.response.body = 'items!';
});

export default router;
