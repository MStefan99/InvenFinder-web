import dbClientPromise from './db.ts';

export function init() {
	return Promise.all([initDB()]);
}

export async function initDB() {
	const db = await dbClientPromise;
	const rows = await db.query('show databases like "invenfinder"');
	if (!rows.length) {
		console.log('Initializing database');

		const sql = await Deno.readTextFile('./ddl.sql');
		for (const stmt of sql.split(';')) {
			stmt.trim().length && await db.execute(stmt);
		}
	}
}
