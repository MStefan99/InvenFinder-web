import { decode as hexDecode, encode as hexEncode } from '../deps.ts';

import dbClientPromise from './db.ts';
import {
	encodePermissions,
	hasPermissions,
	PERMISSIONS,
} from '../../common/permissions.ts';

const PBKDF2ITERATIONS = 100000;

function buf2hex(buf: Uint8Array): string {
	const dec = new TextDecoder();

	return dec.decode(hexEncode(buf));
}

function hex2buf(str: string): Uint8Array {
	const enc = new TextEncoder();

	return hexDecode(enc.encode(str));
}

async function pbkdf2(password: string, salt: string): Promise<string> {
	const enc = new TextEncoder();
	const dec = new TextDecoder();

	const importedKey = await crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		'PBKDF2',
		false,
		['deriveBits'],
	);
	const generatedKey = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: hex2buf(salt),
			iterations: PBKDF2ITERATIONS,
			hash: 'SHA-256',
		},
		importedKey,
		256,
	);

	const encodedKey = hexEncode(new Uint8Array(generatedKey));
	return dec.decode(encodedKey);
}

type Props = {
	id: number;
	username: string;
	passwordSalt: string;
	passwordHash: string;
	permissions?: PERMISSIONS[] | number;
};

class User {
	id: number;
	username: string;
	passwordSalt: string;
	passwordHash: string;
	permissions: number;

	constructor(props: Props) {
		this.id = props.id;
		this.username = props.username;
		this.passwordSalt = props.passwordSalt;
		this.passwordHash = props.passwordHash;
		this.permissions = encodePermissions(props.permissions);
	}

	toJSON() {
		return {
			id: this.id,
			username: this.username,
			permissions: this.permissions,
		};
	}

	save(): Promise<void> {
		return new Promise((resolve, reject) => {
			dbClientPromise.then((client) =>
				client
					.execute(
						`insert into invenfinder.users(id,
						                               username,
						                               password_salt,
						                               password_hash,
						                               permissions)
						 values (?, ?, ?, ?, ?)
						 on duplicate key update username = values(username),
						                         password_salt = values(password_salt),
						                         password_hash = values(password_hash),
						                         permissions = values(permissions)`,
						[
							this.id,
							this.username,
							this.passwordSalt,
							this.passwordHash,
							encodePermissions(this.permissions),
						],
					)
			)
				.then(() => resolve())
				.catch((err) => reject(err));
		});
	}

	static async create(
		username: string,
		password: string,
		permissions: PERMISSIONS[] | number,
	): Promise<User> {
		const passwordSalt = buf2hex(
			crypto.getRandomValues(new Uint8Array(32)),
		);
		const passwordHash = await pbkdf2(password, passwordSalt);

		const client = await dbClientPromise;
		const res = await client.execute(
			`insert into invenfinder.users(username,
			                               password_salt,
			                               password_hash,
			                               permissions)
			 values (?, ?, ?, ?)`,
			[
				username,
				passwordSalt,
				passwordHash,
				encodePermissions(permissions),
			],
		);

		return new User({
			id: Number(res.insertId) ?? 0,
			username,
			passwordSalt,
			passwordHash,
			permissions,
		});
	}

	static async getByID(id: number): Promise<User | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select id, username, password_salt as passwordSalt, password_hash as passwordHash, permissions
			 from invenfinder.users
			 where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			return new User(rows[0]);
		}
	}

	static async getByUsername(username: string): Promise<User | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select id, username, password_salt as passwordSalt, password_hash as passwordHash, permissions
			 from invenfinder.users
			 where username=?`,
			[username],
		);

		if (!rows.length) {
			return null;
		}

		return new User(rows[0]);
	}

	static async getAll(): Promise<User[]> {
		const users = [];

		const client = await dbClientPromise;
		const rows = await client.query(
			`select id, username, password_salt as passwordSalt, password_hash as passwordHash, permissions
			 from invenfinder.users`,
		);

		for (const row of rows) {
			users.push(new User(row));
		}

		return users;
	}

	async verifyPassword(password: string): Promise<boolean> {
		return this.passwordHash ===
			(await pbkdf2(password, this.passwordSalt));
	}

	async setPassword(password: string): Promise<void> {
		this.passwordSalt = buf2hex(crypto.getRandomValues(new Uint8Array(32)));
		this.passwordHash = await pbkdf2(password, this.passwordSalt);
	}

	hasPermissions(permissions: [PERMISSIONS] | number): boolean {
		return hasPermissions(permissions, this.permissions);
	}

	async delete(): Promise<void> {
		const client = await dbClientPromise;
		await client.execute(
			`delete
			 from invenfinder.users
			 where id=?`,
			[this.id],
		);
	}
}

export default User;
