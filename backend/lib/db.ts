import { DBClient } from '../deps.ts';

const dbClientPromise = new DBClient().connect({
	hostname: Deno.env.get('DB_URL'),
	username: Deno.env.get('DB_USER'),
	password: Deno.env.get('DB_PASSWORD'),
	db: 'invenfinder',
});

export default dbClientPromise;
