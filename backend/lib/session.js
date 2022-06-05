'use strict';

const crypto = require('crypto');

const connectionPromise = require('./db');


class Session {
	id;
	publicID;
	userID;
	ip;
	ua;
	time;


	static async createSession(user, ua, ip) {
		if (!user || !ua || !ip) {
			return null;
		}

		const session = new Session();

		session.publicID = crypto.randomBytes(32).toString('hex');
		session.userID = user.id;
		session.ip = ip;
		session.ua = ua;
		session.time = Date.now();

		return session;
	}


	static async getSessionByID(id) {
		if (!id) {
			return null;
		}

		const session = new Session();

		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            public_id as publicID,
		                                            user_id   as userID,
		                                            ip,
		                                            ua,
		                                            time
		                                     from invenfinder.sessions
		                                     where id=?`, [id]);

		if (!rows.length) {
			return null;
		} else {
			Object.assign(session, rows[0]);
			return session;
		}
	}


	static async getSessionByPublicID(id) {
		if (!id) {
			return null;
		}

		const session = new Session();

		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            public_id as publicID,
		                                            user_id   as userID,
		                                            ip,
		                                            ua,
		                                            time
		                                     from invenfinder.sessions
		                                     where public_id=?`, [id]);

		if (!rows.length) {
			return null;
		} else {
			Object.assign(session, rows[0]);
			return session;
		}
	}


	static async getUserSessions(user) {
		if (!user) {
			return null;
		}

		const sessions = [];

		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            public_id as publicID,
		                                            user_id   as userID,
		                                            ip,
		                                            ua,
		                                            time
		                                     from invenfinder.sessions
		                                     where user_id=?`, [user.id]);

		for (const row of rows) {
			const session = new Session();

			Object.assign(session, row);
			sessions.push(session);
		}
		return sessions;
	}


	static async deleteAllUserSessions(user) {
		if (!user) {
			return;
		}

		const connection = await connectionPromise;
		await connection.query(`delete
		                        from invenfinder.sessions
		                        where user_id=?`, [user.id]);
	}


	async delete() {
		const connection = await connectionPromise;
		await connection.query(`delete
		                        from invenfinder.sessions
		                        where id=?`, [this.id]);
	}
}


module.exports = Session;
