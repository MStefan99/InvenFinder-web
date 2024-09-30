import dbClientPromise from '../lib/db.ts';
import Item from './item.ts';
import User from './user.ts';

type PropsBase = {
	userID: number;
	itemID: number;
	amount: number;
};

type LoanProps = PropsBase & {
	id: number;
	approved: boolean;
	username?: string;
	itemName?: string;
};

class Loan {
	id: number;
	userID: number;
	itemID: number;
	amount: number;
	approved: boolean;
	username?: string;
	itemName?: string;

	constructor(props: LoanProps) {
		this.id = props.id;
		this.userID = props.userID;
		this.itemID = props.itemID;
		this.amount = props.amount;
		this.approved = !!props.approved;
		this.username = props.username;
		this.itemName = props.itemName;
	}

	save(): Promise<void> {
		return new Promise((resolve, reject) => {
			dbClientPromise
				.then((client) =>
					client.execute(
						`insert into invenfinder.loans(id, user_id, item_id, amount, approved)
						 values (?, ?, ?, ?, ?)
						 on duplicate key update user_id = values(user_id),
						                         item_id = values(item_id),
						                         amount = values(amount),
						                         approved = values(approved)`,
						[
							this.id,
							this.userID,
							this.itemID,
							this.amount,
							this.approved,
						],
					)
				)
				.then(() => resolve())
				.catch((err) => reject(err));
		});
	}

	static async create(options: PropsBase): Promise<Loan | null> {
		if (!options.userID || !options.itemID) {
			return null;
		}

		const client = await dbClientPromise;
		const res = await client.execute(
			`insert into invenfinder.loans(user_id, item_id, amount)
			 values (?, ?, ?)`,
			[
				options.userID,
				options.itemID,
				options.amount,
			],
		);

		return new Loan({
			id: res.lastInsertId ?? 0,
			userID: options.userID,
			itemID: options.itemID,
			amount: options.amount,
			approved: false,
		});
	}

	static async getByID(id: number): Promise<Loan | null> {
		const client = await dbClientPromise;
		const rows = await client.query(
			`select loans.id as id, user_id as userID, item_id as itemID, amount, approved, username
			 from invenfinder.loans
				      join invenfinder.users on loans.user_id=users.id
			 where loans.id=?`,
			[id],
		);

		if (!rows.length) {
			return null;
		} else {
			const row = rows[0];
			return new Loan(row);
		}
	}

	static async getByItem(item: Item): Promise<Loan[]> {
		const loans = [];

		const client = await dbClientPromise;
		const rows = await client.query(
			`select loans.id as id, user_id as userID, item_id as itemID, amount, approved, username
			 from invenfinder.loans
				      join invenfinder.users on loans.user_id=users.id
			 where item_id=?`,
			[item.id],
		);

		for (const row of rows) {
			loans.push(new Loan(row));
		}
		return loans;
	}

	static async getByUser(user: User): Promise<Loan[]> {
		const loans = [];

		const client = await dbClientPromise;
		const rows = await client.query(
			`select loans.id as id, user_id as userID, item_id as itemID, loans.amount, approved, items.name as itemName
			 from invenfinder.loans
				      join invenfinder.items on loans.item_id=items.id
			 where user_id=?`,
			[user.id],
		);

		for (const row of rows) {
			loans.push(new Loan(row));
		}
		return loans;
	}

	static async getByItemAndUser(
		item: Item,
		user: User,
	): Promise<Loan[]> {
		const loans = [];

		const client = await dbClientPromise;
		const rows = await client.query(
			`select loans.id as id, user_id as userID, item_id as itemID, amount, approved
			 from invenfinder.loans
			 where item_id=?
				 and user_id=?`,
			[item.id, user.id],
		);

		for (const row of rows) {
			loans.push(new Loan(row));
		}
		return loans;
	}

	async delete(): Promise<void> {
		const client = await dbClientPromise;
		await client.execute(
			`delete
			 from invenfinder.loans
			 where id=?`,
			[this.id],
		);
	}
}

export default Loan;
