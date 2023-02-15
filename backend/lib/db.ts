import { mariadb } from '../deps.ts';

const dbClientPromise = mariadb.createConnection({
	host: Deno.env.get('DB_URL'),
	user: Deno.env.get('DB_USERNAME'),
	password: Deno.env.get('DB_PASSWORD'),
});

export default dbClientPromise;
