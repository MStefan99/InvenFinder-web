'use strict';

const Location = require('./location');
const connectionPromise = require('./db');
const crypto = require('crypto');


module.exports = class Item {
	id;
	name;
	description;
	location;
	amount;

	#saveHandle;


	static #makeReactive(user) {
		const proxy = {
			set(target, propertyKey, value, receiver) {
				clearImmediate(target.#saveHandle);

				target.#saveHandle = setImmediate(async () => {
					const connection = await connectionPromise;
					await connection.query(`insert into invenfinder.items(id, name, description, cabinet, col, row, amount)
					                        values (?, ?, ?, ?, ?, ?, ?)
					                        on duplicate key update id = values(id),
					                                                name = values(name),
					                                                description = values(description),
					                                                cabinet = values(cabinet),
					                                                col = values(col),
					                                                row = values(row),
					                                                amount = values(amount)`,
						[target.id, target.name, target.description, target.cabinet, target.col, target.row, target.amount]);
				});

				return Reflect.set(target, propertyKey, value, receiver);
			}
		};

		return new Proxy(user, proxy);
	}


	static #assignItem(item, props) {
		item.id = props.id;
		item.name = props.name;
		item.description = props.description;
		item.location = new Location(props.cabinet, props.col, props.row);
		item.amount = props.amount;

		return item;
	}


	static async create(options) {
		if (!options.name
			|| !options.cabinet
			|| !options.col
			|| !options.row
			|| !options.amount) {
			return null;
		}

		const item = this.#assignItem(this.#makeReactive(new Item()), options);

		const connection = await connectionPromise;
		const res = await connection.query(`insert into invenfinder.items(name,
		                                                                  description,
		                                                                  cabinet,
		                                                                  col,
		                                                                  row,
		                                                                  amount)
		                                    values (?, ?, ?, ?, ?, ?)`,
			[item.name, item.description, item.cabinet, item.col, item.row, item.amount]);

		item.id = res.insertId;
		clearImmediate(user.#saveHandle);
		return item;
	}


	static async getByID(id) {
		if (!id) {
			return null;
		}

		const connection = await connectionPromise;
		const rows = await connection.query(`select *
		                                     from invenfinder.items
		                                     where id=?`, [id]);

		if (!rows.length) {
			return null;
		} else {
			return this.#assignItem(new Item(), rows[0]);
		}
	}


	static async getByLocation(location) {
		if (!location) {
			return null;
		}

		const connection = await connectionPromise;
		const rows = await connection.query(`select *
		                                     from invenfinder.items
		                                     where cabinet=?
				                                   and col=?
				                                   and row=?`,
			[location.cabinet, location.col, location.row]);

		if (!rows.length) {
			return null;
		} else {
			return this.#assignItem(new Item(), rows[0]);
		}
	}
};


module.exports = Item;
