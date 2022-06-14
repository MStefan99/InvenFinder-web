import {Router} from 'https://deno.land/x/oak@v10.6.0/mod.ts';


const router = new Router({
	prefix: '/auth',
});


router.get('/', ctx => {
	ctx.response.body = 'auth!';
});


export default router;
