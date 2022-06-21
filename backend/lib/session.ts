import {
	encode as hexEncode,
} from 'https://deno.land/std@0.144.0/encoding/hex.ts';

import dbClientPromise from './db.ts';
import User from './user.ts';

function getRandomString(byteCount: number): string {
	const dec = new TextDecoder();
	const data = crypto.getRandomValues(new Uint8Array(byteCount));

	return dec.decode(hexEncode(data));
}

class Session {
	id: number;
	publicID: string;
	userID: number;
	ip: string;
	ua: string;
	time: number;

	constructor(
		id: number,
		publicID: string,
		userID: number,
		ip: string,
		ua: string,
		time: number,
	) {
		this.id = id;
		this.publicID = publicID;
		this.userID = userID;
		this.ip = ip;
		this.ua = ua;
		this.time = time;
	}

	static async create(user: User, ip: string, ua: string): Promise<Session> {
		const publicID = getRandomString(32);
		const time = Date.now();

		const client = await dbClientPromise;
		const res = await client.execute(
			`insert into invenfinder.sessions(public_id,
			                                  user_id,
			                                  ip,
			                                  ua,
			                                  time)
			 values (?, ?, ?, ?, ?)`,
			[
				publicID,
				user.id,
				ip,
				ua,
				time,
			],
		);

		return new Session(
			res.lastInsertId ?? 0,
			publicID,
			user.id,
			ip,
			ua,
			time,
		);
	}

	static async getByID(id: number): Promise<Session | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select id,
			        public_id as publicID,
			        user_id   as userID,
			        ip,
			        ua,
			        time
			 from invenfinder.sessions
			 where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Session(
				row.id,
				row.publicID,
				row.userID,
				row.ip,
				row.ua,
				row.time,
			);
		}
	}

	static async getByPublicID(id: string): Promise<Session | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select id,
			        public_id as publicID,
			        user_id   as userID,
			        ip,
			        ua,
			        time
			 from invenfinder.sessions
			 where public_id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Session(
				row.id,
				row.publicID,
				row.userID,
				row.ip,
				row.ua,
				row.time,
			);
		}
	}

	static async getUserSessions(user: User): Promise<Session[]> {
		const sessions = [];

		const client = await dbClientPromise;
		const rows = await client.query(
			`select id,
			        public_id as publicID,
			        user_id   as userID,
			        ip,
			        ua,
			        time
			 from invenfinder.sessions
			 where user_id=?`,
			[user.id],
		);

		for (const row of rows) {
			sessions.push(
				new Session(
					row.id,
					row.publicID,
					row.userID,
					row.ip,
					row.ua,
					row.time,
				),
			);
		}
		return sessions;
	}

	static async deleteAllUserSessions(user: User): Promise<void> {
		const client = await dbClientPromise;
		await client.execute(
			`delete
			 from invenfinder.sessions
			 where user_id=?`,
			[user.id],
		);
	}

	async delete(): Promise<void> {
		const client = await dbClientPromise;
		await client.execute(
			`delete
			 from invenfinder.sessions
			 where id=?`,
			[this.id],
		);
	}
}

export default Session;
