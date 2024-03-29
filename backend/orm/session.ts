import { encode as hexEncode } from '../deps.ts';

import dbPromise from '../lib/db.ts';
import User from './user.ts';

function getRandomString(byteCount: number): string {
	const dec = new TextDecoder();
	const data = crypto.getRandomValues(new Uint8Array(byteCount));

	return dec.decode(hexEncode(data));
}

type SessionProps = {
	id: number;
	publicID: string;
	userID: number;
	ip: string;
	ua: string;
	time: number | string;
};

class Session {
	id: number;
	publicID: string;
	userID: number;
	ip: string;
	ua: string;
	time: number;

	constructor(props: SessionProps) {
		this.id = props.id;
		this.publicID = props.publicID;
		this.userID = props.userID;
		this.ip = props.ip;
		this.ua = props.ua;
		this.time = (typeof props.time === 'string')
			? Date.parse(props.time)
			: props.time;
	}

	toJSON() {
		return {
			id: this.publicID,
			ip: this.ip,
			ua: this.ua,
			time: this.time,
		};
	}

	async save(): Promise<void> {
		const db = await dbPromise;
		await db
			.execute(
				`insert into invenfinder.sessions(id,
				                               public_id,
				                               user_id,
				                               ip,
                                 ua,
				                               time)
				 values (?, ?, ?, ?, ?, ?)
				 on duplicate key update public_id = values(public_id),
				                         user_id = values(user_id),
				                         ip = values(ip),
				                         ua = values(ua),
				                         time = values(time)`,
				[
					this.id,
					this.publicID,
					this.ip,
					this.ua,
					this.time,
				],
			);
	}

	static async create(user: User, ip: string, ua: string): Promise<Session> {
		const publicID = getRandomString(32);
		const time = new Date().toISOString().replace('T', ' ').slice(0, -1);

		const db = await dbPromise;
		const res = await db.execute(
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

		return new Session({
			id: res.lastInsertId ?? 0,
			publicID,
			userID: user.id,
			ip,
			ua,
			time,
		});
	}

	static async getByID(id: number): Promise<Session | null> {
		const db = await dbPromise;
		const rows = await db.query(
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
			return new Session(row);
		}
	}

	static async getByPublicID(id: string): Promise<Session | null> {
		const db = await dbPromise;
		const rows = await db.query(
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
			return new Session(row);
		}
	}

	static async getUserSessions(user: User): Promise<Session[]> {
		const sessions = [];

		const db = await dbPromise;
		const rows = await db.query(
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
				new Session(row),
			);
		}
		return sessions;
	}

	static async deleteAllUserSessions(user: User): Promise<void> {
		const db = await dbPromise;
		await db.execute(
			`delete
			 from invenfinder.sessions
			 where user_id=?`,
			[user.id],
		);
	}

	async delete(): Promise<void> {
		const db = await dbPromise;
		await db.execute(
			`delete
			 from invenfinder.sessions
			 where id=?`,
			[this.id],
		);
	}
}

export default Session;
