'use strict';

const Location = require('./location');
const connectionPromise = require('./db');


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


	static #assignItem(item, row) {
		item.id = row.id;
		item.name = row.name;
		item.description = row.description;
		item.location = new Location(row.drawer, row.col, row.row);
		item.amount = row.amount;
		item.locationID = row.location_id;
	}


	static async createItem(item) {

	}


	async getItems() {

	}
};
