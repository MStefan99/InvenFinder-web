import { DBClient } from '../deps.ts';

const dbClientPromise = new DBClient().connect({
	hostname: Deno.env.get('DB_URL'),
	username: Deno.env.get('DB_USERNAME'),
	password: Deno.env.get('DB_PASSWORD'),
});

export default dbClientPromise;
