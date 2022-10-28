import dbPromise from './db.ts';

type PropsBase = {
	name: string;
	description: string | null;
	link: string | null;
	location: string;
	amount: number;
};

type ItemProps = PropsBase & {
	id: number;
};

class Item {
	id: number;
	name: string;
	description: string | null = null;
	link: string | null = null;
	location: string;
	amount: number;

	constructor(props: ItemProps) {
		this.id = props.id;
		this.name = props.name;
		this.description = props.description;
		this.link = props.link;
		this.location = props.location;
		this.amount = props.amount;
	}

	async save(): Promise<void> {
		const db = await dbPromise;
		await db.execute(
			`insert into invenfinder.items(id, name, description, link, location, amount)
			 values (?, ?, ?, ?, ?, ?)
			 on duplicate key update name = values(name),
			                         description = values(description),
			                         link = values(link),
			                         location = values(location),
			                         amount = values(amount)`,
			[
				this.id,
				this.name,
				this.description,
				this.link,
				this.location,
				this.amount,
			],
		);
	}

	static async create(options: PropsBase): Promise<Item | null> {
		if (!options.location) {
			return null;
		}

		const db = await dbPromise;
		const res = await db.execute(
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

		return new Item({
			id: res.lastInsertId ?? 0,
			name: options.name,
			description: options.description,
			link: options.link,
			location: options.location,
			amount: options.amount,
		});
	}

	static async getByID(id: number): Promise<Item | null> {
		const db = await dbPromise;
		const rows = await db.query(
			`select *
			 from invenfinder.items
			 where id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Item(row);
		}
	}

	static async getByLocation(location: string): Promise<Item | null> {
		const db = await dbPromise;
		const rows = await db.query(
			`select *
			 from invenfinder.items
			 where location=?`,
			[location],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Item(row);
		}
	}

	static async getAll(): Promise<Item[]> {
		const items = [];

		const db = await dbPromise;
		const rows = await db.query(`select *
		                             from invenfinder.items`);

		for (const row of rows) {
			items.push(new Item(row));
		}
		return items;
	}

	static async search(query: string): Promise<Item[]> {
		const items = [];

		const db = await dbPromise;
		const rows = await db.query(
			`select *
			 from invenfinder.items
			 where match (name, description)
				       against (?)`,
			[query],
		);

		for (const row of rows) {
			items.push(new Item(row));
		}
		return items;
	}

	async delete(): Promise<void> {
		const db = await dbPromise;
		await db.execute(
			`delete
			 from invenfinder.items
			 where id=?`,
			[this.id],
		);
	}
}

export default Item;
