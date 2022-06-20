import * as Permissions from './permissions.ts';
import connectionPromise from './db.ts';
import {PERMISSIONS} from "./permissions.ts";

const PBKDF2ITERATIONS = 100000;
const DEFAULT_PERMISSIONS = 0;


type Props = {
	id: number,
	username: string,
	passwordSalt: string,
	passwordHash: string,
	permissions: number | undefined
}


class User {
	id: number;
	username: string;
	passwordSalt: string;
	passwordHash: string;
	permissions: number;

	#saveHandle: number | undefined;

	constructor(props: Props) {
		this.id = props.id;
		this.username = props.username;
		this.passwordSalt = props.passwordSalt;
		this.passwordHash = props.passwordHash;
		this.permissions = props.permissions ?? DEFAULT_PERMISSIONS;
	}

	static #makeReactive(user: User): User {
		const proxy: ProxyHandler<User> = {
			set(target, propertyKey, value, receiver) {
				clearInterval(target.#saveHandle);

				target.#saveHandle = setInterval(async () => {
					const connection = await connectionPromise;
					await connection.query(
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
							target.id,
							target.username,
							target.passwordSalt,
							target.passwordHash,
							target.permissions,
						],
					);
				});

				return Reflect.set(target, propertyKey, value, receiver);
			},
		};

		return new Proxy(user, proxy);
	}

	static async create(username: string, password: string, permissions: number | undefined): Promise<User> {
		const passwordSalt = 'ab';  // TODO: generate random salt
		const passwordHash = 'abcd';  // TODO: generate key with PBKDF2

		const connection = await connectionPromise;
		const res = await connection.query(
			`insert into invenfinder.users(username,
			                               password_salt,
			                               password_hash,
			                               permissions)
			 values (?, ?, ?, ?)`,
			[
				username,
				passwordSalt,
				passwordHash,
				permissions,
			],
		);

		return this.#makeReactive(new User({
			id: res.insertId,
			username,
			passwordSalt,
			passwordHash,
			permissions: permissions ?? DEFAULT_PERMISSIONS
		}));
	}

	static async getByID(id: number): Promise<User | null> {
		const connection = await connectionPromise;
		const rows = await connection.query(
			`select *
			 from invenfinder.users
			 where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			return this.#makeReactive(new User(rows[0]));
		}
	}

	static async getByUsername(username: string): Promise<User|null> {
		const connection = await connectionPromise;
		const rows = await connection.query(
			`select *
			 from invenfinder.users
			 where username=?`,
			[username],
		);

		if (!rows.length) {
			return null;
		}

		return this.#makeReactive(new User(rows[0]));
	}

	static async getAll(): Promise<User[]> {
		const users = [];

		const connection = await connectionPromise;
		const rows = await connection.query(`select *
		                                     from invenfinder.users`);

		for (const row of rows) {
			users.push(this.#makeReactive(new User(row)));
		}

		return users;
	}

	async verifyPassword(password: string): Promise<boolean> {
		await Promise.resolve();
		// TODO: verify password
		return true;
	}

	async setPassword(password: string): Promise<void> {
		await Promise.resolve();
		const passwordSalt = 'ab';  // TODO: generate random salt
		const passwordHash = 'abcd';  // TODO: generate key with PBKDF2
	}

	hasPermissions(permissions: [Permissions.PERMISSIONS]): boolean {
		const permissionValue = Permissions.getPermissionValue(permissions);

		// noinspection JSBitwiseOperatorUsage
		return ((this.permissions & permissionValue) === permissionValue);
	}

	async delete(): Promise<void> {
		const connection = await connectionPromise;
		await connection.query(
			`delete
			 from invenfinder.users
			 where id=?`,
			[this.id],
		);
	}
}

export default User;
