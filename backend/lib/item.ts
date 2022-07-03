import dbClientPromise from './db.ts';

type PropsBase = {
	name: string;
	description: string | null;
	link: string | null;
	location: string;
	amount: number;
};

type Props = PropsBase & {
	id: number;
};

class Item {
	id: number;
	name: string;
	description: string | null = null;
	link: string | null = null;
	location: string;
	amount: number;

	#saveHandle: number | undefined = undefined;

	constructor(props: Props) {
		this.id = props.id;
		this.name = props.name;
		this.description = props.description;
		this.link = props.link;
		this.location = props.location;
		this.amount = props.amount;
	}

	static #makeReactive(item: Item): Item {
		const proxy: ProxyHandler<Item> = {
			set(target, propertyKey, value, receiver) {
				clearTimeout(target.#saveHandle);

				target.#saveHandle = setTimeout(async () => {
					const client = await dbClientPromise;
					await client.execute(
						`insert into invenfinder.items(id, name, description, link, location, amount)
						 values (?, ?, ?, ?, ?, ?)
						 on duplicate key update name = values(name),
						                         description = values(description),
						                         link = values(link),
						                         location = values(location),
						                         amount = values(amount)`,
						[
							target.id,
							target.name,
							target.description,
							target.link,
							target.location,
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
			                               link,
			                               location,
			                               amount)
			 values (?, ?, ?, ?, ?)`,
			[
				options.name,
				options.description,
				options.link,
				options.location,
				options.amount,
			],
		);

		const item = new Item({
			id: res.lastInsertId ?? 0,
			name: options.name,
			description: options.description,
			link: options.link,
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
				new Item(row),
			);
		}
	}

	static async getByLocation(location: string): Promise<Item | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select *
			 from invenfinder.items
			 where location=?`,
			[location],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return this.#makeReactive(
				new Item(row),
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
				new Item(row),
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
