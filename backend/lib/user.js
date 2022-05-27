'use strict';

const crypto = require('crypto');
const util = require('util');

const connectionPromise = require('./db');

const pbkdf2 = util.promisify(crypto.pbkdf2);

const PBKDF2ITERATIONS = 100000;
const DEFAULT_PERMISSIONS = 0;


class User {
	id;
	username;
	#passwordSalt;
	#passwordHash;
	permissions;


	static #assignUser(user, row) {
		user.id = row.id;
		user.username = row.username;
		user.#passwordSalt = row.password_salt;
		user.#passwordHash = row.password_hash;
		user.permissions = row.permissions;

		return user;
	}


	static async createUser(username, password, permissions = DEFAULT_PERMISSIONS) {
		const user = new User();

		const salt = crypto.randomBytes(32);
		const hash = await pbkdf2(password, salt, PBKDF2ITERATIONS, 64, 'sha3-256');

		user.username = username;
		user.permissions = permissions;
		user.#passwordSalt = salt.toString('base64');
		user.#passwordHash = hash.toString('base64');

		const connection = await connectionPromise;
		const res = await connection.query(`insert into invenfinder.users(username, password_salt, password_hash, permissions)
		                                    values (?, ?, ?, ?)`,
			[user.username, user.#passwordSalt, user.#passwordHash, user.permissions]);

		user.id = res.insertId;
		return user;
	}


	static async getUserByID(id) {
		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            username,
		                                            password_hash,
		                                            password_salt,
		                                            permissions
		                                     from invenfinder.users
		                                     where id=?`, [id]);

		if (!rows.length) {
			return null;
		} else {
			return this.#assignUser(new User, rows[0]);
		}
	}


	static async getUserByUsername(username) {
		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            username,
		                                            password_salt,
		                                            password_hash,
		                                            permissions
		                                     from invenfinder.users
		                                     where username=?`, [username]);

		if (!rows.length) {
			return null;
		}

		return this.#assignUser(new User(), rows[0]);
	}


	static async getAllUsers() {
		const users = [];

		const connection = await connectionPromise;
		const rows = await connection.query(`select id,
		                                            username,
		                                            password_salt,
		                                            password_hash,
		                                            permissions
		                                     from invenfinder.users`);

		for (const row of rows) {
			users.push(this.#assignUser(new User(), row));
		}

		return users;
	}


	async verifyPassword(password) {
		const salt = Buffer.from(this.#passwordSalt, 'base64');
		const hash = Buffer.from(this.#passwordHash, 'base64');

		return hash.equals(await pbkdf2(password, salt, PBKDF2ITERATIONS, 64, 'sha3-256'));
	}


	async setPassword(password) {
		const salt = crypto.randomBytes(32);
		const hash = await pbkdf2(password, salt, PBKDF2ITERATIONS, 64, 'sha3-256');

		this.#passwordSalt = salt.toString('base64');
		this.#passwordHash = hash.toString('base64');

		const connection = await connectionPromise;
		await connection.query(`update invenfinder.users
		                        set password_salt=?,
		                            password_hash=?
		                        where id=?`, [this.#passwordSalt, this.#passwordHash, this.id]);

		return this;
	}


	async delete() {
		const connection = await connectionPromise;
		await connection.query(`delete
		                        from invenfinder.users
		                        where id=?`, [this.id]);
	}
}


module.exports = User;
