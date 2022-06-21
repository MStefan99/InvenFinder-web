import Location from './location.ts';
import dbClientPromise from './db.ts';

type PropsBase = {
	name: string;
	description: string | null;
	location: Location | {
		cabinet: number;
		col: number;
		row: number;
	};
	amount: number;
};

type Props = PropsBase & {
	id: number;
};

class Item {
	id: number;
	name: string;
	description: string | null = null;
	location: Location;
	amount: number;

	#saveHandle: number | undefined = undefined;

	constructor(props: Props) {
		this.id = props.id;
		this.name = props.name;
		this.description = props.description;
		this.location = new Location(0, 0, 0);
		if (props.location instanceof Location) {
			this.location = props.location;
		} else {
			this.location = new Location(
				props.location.cabinet,
				props.location.col,
				props.location.row,
			);
		}
		this.amount = props.amount;
	}

	static #makeReactive(item: Item): Item {
		const proxy: ProxyHandler<Item> = {
			set(target, propertyKey, value, receiver) {
				clearTimeout(target.#saveHandle);

				target.#saveHandle = setTimeout(async () => {
					const client = await dbClientPromise;
					await client.execute(
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

	static async create(options: PropsBase): Promise<Item | null> {
		if (!options.location) {
			return null;
		}

		const client = await dbClientPromise;
		const res = await client.execute(
			`insert into invenfinder.items(name,
			                               description,
			                               cabinet,
			                               col,
			                               row,
			                               amount)
			 values (?, ?, ?, ?, ?, ?)`,
			[
				options.name,
				options.description,
				options.location.cabinet,
				options.location.col,
				options.location.row,
				options.amount,
			],
		);

		const item = new Item({
			id: res.lastInsertId ?? 0,
			name: options.name,
			description: options.description,
			location: options.location,
			amount: options.amount,
		});
		return this.#makeReactive(item);
	}

	static async getByID(id: number): Promise<Item | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select *
			 from invenfinder.items
			 where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return this.#makeReactive(
				new Item({
					id: row.id,
					name: row.name,
					description: row.description,
					location: new Location(row.cabinet, row.col, row.row),
					amount: row.amount,
				}),
			);
		}
	}

	static async getByLocation(location: Location): Promise<Item | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
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
			const row = rows[0];
			return this.#makeReactive(
				new Item({
					id: row.id,
					name: row.name,
					description: row.description,
					location: new Location(row.cabinet, row.col, row.row),
					amount: row.amount,
				}),
			);
		}
	}

	static async getAll(): Promise<Item[]> {
		const items = [];

		const client = await dbClientPromise;
		const rows = await client.query(`select *
		                                     from invenfinder.items`);

		for (const row of rows) {
			items.push(this.#makeReactive(
				new Item({
					id: row.id,
					name: row.name,
					description: row.description,
					location: new Location(row.cabinet, row.col, row.row),
					amount: row.amount,
				}),
			));
		}
		return items;
	}

	async delete(): Promise<void> {
		const client = await dbClientPromise;
		await client.execute(
			`delete
			 from invenfinder.items
			 where id=?`,
			[this.id],
		);
	}
}

export default Item;
