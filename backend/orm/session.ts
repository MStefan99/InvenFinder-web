import { encodeHex } from '../deps.ts';

import dbPromise from '../lib/db.ts';
import User from './user.ts';
import { ssoProviders } from '../lib/sso.ts';

function getRandomString(byteCount: number): string {
	const data = crypto.getRandomValues(new Uint8Array(byteCount));

	return encodeHex(data);
}

function dateToString(date: Date): string {
	return date.toISOString().replace('T', ' ').slice(0, -1);
}

type SessionProps = {
	id: number;
	token: string;
	userID: number;
	ip: string;
	ua: string;
	time: number | string;
	ssoProvider?: string;
	lastVerified?: number | string;
	revoked?: boolean;
};

class Session {
	id: number;
	token: string;
	userID: number;
	ip: string;
	ua: string;
	time: Date;
	ssoProvider?: string;
	lastVerified?: Date;
	revoked?: boolean;

	constructor(props: SessionProps) {
		this.id = props.id;
		this.token = props.token;
		this.userID = props.userID;
		this.ip = props.ip;
		this.ua = props.ua;
		this.time = new Date(props.time);
		this.ssoProvider = props.ssoProvider;
		this.lastVerified = props.lastVerified
			? new Date(props.lastVerified)
			: undefined;
		this.revoked = props.revoked;
	}

	toJSON() {
		return {
			token: this.token,
			ip: this.ip,
			ua: this.ua,
			time: this.time,
			ssoProvider: this.ssoProvider,
		};
	}

	async save(): Promise<void> {
		const db = await dbPromise;
		await db
			.execute(
				`insert into invenfinder.sessions(id,
				                                  token,
				                                  user_id,
				                                  ip,
				                                  ua,
				                                  time,
				                                  last_verified,
				                                  sso_provider,
				                                  revoked)
				 values (?, ?, ?, ?, ?, ?, ?, ?, ?)
				 on duplicate key update token = values(token),
				                         user_id = values(user_id),
				                         ip = values(ip),
				                         ua = values(ua),
				                         time = values(time),
				                         last_verified = values(last_verified),
				                         sso_provider = values(sso_provider),
				                         revoked = values(revoked)`,
				[
					this.id,
					this.token,
					this.userID,
					this.ip,
					this.ua,
					this.time,
					this.lastVerified,
					this.ssoProvider,
					this.revoked,
				],
			);
	}

	static async create(
		user: User,
		ip: string,
		ua: string,
		token?: string,
		ssoProvider?: string,
	): Promise<Session> {
		const sessionToken = token ?? getRandomString(32);
		const time = dateToString(new Date());

		const db = await dbPromise;
		const res = await db.execute(
			`insert into invenfinder.sessions(token,
			                                  user_id,
			                                  ip,
			                                  ua,
			                                  time,
			sso_provider, 
			last_verified)
			 values (?,  ?, ?, ?, ?, ?, ?)`,
			[
				sessionToken,
				user.id,
				ip,
				ua,
				time,
				ssoProvider,
				ssoProvider ? time : null,
			],
		);

		return new Session({
			id: res.lastInsertId ?? 0,
			token: sessionToken,
			userID: user.id,
			ip,
			ua,
			time,
			ssoProvider,
			lastVerified: ssoProvider && time,
		});
	}

	static async getByID(id: number): Promise<Session | null> {
		const db = await dbPromise;
		const rows = await db.query(
			`select id,
			        token,
			        user_id       as userID,
			        ip,
			        ua,
			        time,
			        sso_provider  as ssoProvider,
			        last_verified as lastVerified,
			        revoked
			 from invenfinder.sessions
			 where id=?
				 and not revoked`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Session(row);
		}
	}

	static async getByToken(token: string): Promise<Session | null> {
		const db = await dbPromise;
		const rows = await db.query(
			`select id,
			        token,
			        user_id       as userID,
			        ip,
			        ua,
			        time,
			        sso_provider  as ssoProvider,
			        last_verified as lastVerified,
			        revoked
			 from invenfinder.sessions
			 where token=?`,
			[token],
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
			        token,
			        user_id       as userID,
			        ip,
			        ua,
			        time,
			        sso_provider  as ssoProvider,
			        last_verified as lastVerified,
			        revoked
			 from invenfinder.sessions
			 where user_id=?
				 and not revoked`,
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
			`update
				 invenfinder.sessions
			 set revoked = true
			 where user_id=?`,
			[user.id],
		);
		await db.execute(
			`delete
			 from invenfinder.sessions
			 where user_id=?
				 and sso_provider is null`,
			[user.id],
		);
	}

	async delete(force: boolean = false): Promise<void> {
		const db = await dbPromise;
		if (this.ssoProvider && !force) {
			await db.execute(
				`update invenfinder.sessions
				 set revoked = true
				 where id=?`,
				[this.id],
			);
		} else {
			await db.execute(
				`delete
				 from invenfinder.sessions
				 where id=?`,
				[this.id],
			);
		}
	}
}

export default Session;
