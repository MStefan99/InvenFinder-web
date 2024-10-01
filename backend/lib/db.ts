import { DBClient } from '../deps.ts';
import log from './log.ts';
import User from '../orm/user.ts';

const dbPromise = new DBClient().connect({
	hostname: Deno.env.get('DB_URL'),
	username: Deno.env.get('DB_USERNAME'),
	password: Deno.env.get('DB_PASSWORD'),
});

export default dbPromise;

export async function initDB() {
	const db = await dbPromise;
	const rows = await db.query('show databases like "invenfinder"');
	if (!rows.length) {
		log.log('Initializing database');

		const sql = await Deno.readTextFile('./ddl.sql');
		for (const stmt of sql.split(';')) {
			stmt.trim().length && await db.execute(stmt);
		}

		await User.create('admin', 'admin', 0xffff);
	}
}
