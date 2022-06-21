import Location from './location.ts';
import dbClientPromise from './db.ts';

type Props = {
	id: number;
	name: string;
	description: string | null;
	location: Location | undefined;
	amount: number;
	cabinet: number | undefined;
	col: number | undefined;
	row: number | undefined;
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
		if (props.location) {
			this.location = props.location;
		} else if (props.cabinet !== undefined && props.col !== undefined && props.row !== undefined) {
			new Location(props.cabinet, props.col, props.row);
		}
		this.amount = props.amount;
	}


	static #makeReactive(item: Item): Item {
		const proxy: ProxyHandler<Item> = {
			set(target, propertyKey, value, receiver) {
				clearInterval(target.#saveHandle);

				target.#saveHandle = setInterval(async () => {
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


	static async create(options: Props): Promise<Item | null> {
		if (options.cabinet !== undefined && options.col !== undefined && options.row !== undefined) {
			options.location = new Location(options.cabinet, options.col, options.row);
		}
		if (!options.location) {
			return null;
		}

		const item = new Item(options);

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
				item.name,
				item.description,
				item.location.cabinet,
				item.location.col,
				item.location.row,
				item.amount,
			],
		);

		item.id = res.lastInsertId ?? 0;
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
			return this.#makeReactive(new Item(rows[0]));
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
			return this.#makeReactive(new Item(rows[0]));
		}
	}

	static async getAll(): Promise<Item[]> {
		const items = [];

		const client = await dbClientPromise;
		const rows = await client.query(`select *
		                                     from invenfinder.items`);

		for (const row of rows) {
			items.push(this.#makeReactive(new Item(row)));
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
