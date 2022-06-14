'use strict';

const Location = require('./location');
const connectionPromise = require('./db');

class Item {
	id;
	name;
	description;
	location;
	amount;

	#saveHandle;

	static #makeReactive(item) {
		const proxy = {
			set(target, propertyKey, value, receiver) {
				clearImmediate(target.#saveHandle);

				target.#saveHandle = setImmediate(async () => {
					const connection = await connectionPromise;
					await connection.query(
						`insert into invenfinder.items(id, name, description, cabinet, col, row, amount)
					                        values (?, ?, ?, ?, ?, ?, ?)
					                        on duplicate key update name = values(name),
					                                                description = values(description),
					                                                cabinet = values(cabinet),
					                                                col = values(col),
					                                                row = values(row),
					                                                amount = values(amount)`,
						[
							target.id,
							target.name,
							target.description,
							target.location.cabinet,
							target.location.col,
							target.location.row,
							target.amount,
						],
					);
				});

				return Reflect.set(target, propertyKey, value, receiver);
			},
		};

		return new Proxy(item, proxy);
	}

	static #assignItem(item, props) {
		item.id = props.id;
		item.name = props.name;
		item.description = props.description;
		item.location = props.location ??
			new Location(props.cabinet, props.col, props.row);
		item.amount = props.amount;

		return item;
	}

	static async create(options) {
		if (
			!options.name ||
			!options.amount
		) {
			return null;
		}
		if (
			options.cabinet ||
			options.col ||
			options.row
		) {
			options.location = new Location(
				options.cabinet,
				options.col,
				options.row,
			);
		}
		if (!options.location) {
			return null;
		}

		const item = this.#assignItem(new Item(), options);

		const connection = await connectionPromise;
		const res = await connection.query(
			`insert into invenfinder.items(name,
		                                                                  description,
		                                                                  cabinet,
		                                                                  col,
		                                                                  row,
		                                                                  amount)
		                                    values (?, ?, ?, ?, ?, ?)`,
			[
				item.name,
				item.description,
				item.location.cabinet,
				item.location.col,
				item.location.row,
				item.amount,
			],
		);

		item.id = Number(res.insertId);
		return this.#makeReactive(item);
	}

	static async getByID(id) {
		if (!id) {
			return null;
		}

		const connection = await connectionPromise;
		const rows = await connection.query(
			`select *
		                                     from invenfinder.items
		                                     where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			return this.#makeReactive(this.#assignItem(new Item(), rows[0]));
		}
	}

	static async getByLocation(location) {
		if (!location) {
			return null;
		}

		const connection = await connectionPromise;
		const rows = await connection.query(
			`select *
		                                     from invenfinder.items
		                                     where cabinet=?
				                                   and col=?
				                                   and row=?`,
			[location.cabinet, location.col, location.row],
		);

		if (!rows.length) {
			return null;
		} else {
			return this.#makeReactive(this.#assignItem(new Item(), rows[0]));
		}
	}

	static async getAll() {
		const items = [];

		const connection = await connectionPromise;
		const rows = await connection.query(`select *
		                                     from invenfinder.items`);

		for (const row of rows) {
			items.push(this.#makeReactive(this.#assignItem(new Item(), row)));
		}
		return items;
	}

	async delete() {
		const connection = await connectionPromise;
		await connection.query(
			`delete
		                        from invenfinder.items
		                        where id=?`,
			[this.id],
		);
	}
}

module.exports = Item;
