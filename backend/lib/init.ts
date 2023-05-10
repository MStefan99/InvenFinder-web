import dbPromise from './db.ts';
import User from '../orm/user.ts';
import log from './log.ts';

export function init() {
	return Promise.all([initDB()]);
}

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
