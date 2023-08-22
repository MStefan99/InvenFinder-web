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
						`insert into invenfinder.loans(id, userID, itemID, amount, approved)
						 values (?, ?, ?, ?, ?)
						 on duplicate key update userID = values(userID),
						                         itemID = values(itemID),
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
			`insert into invenfinder.loans(userID, itemID, amount)
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
			`select loans.id as id, userID, itemID, amount, approved, username
			 from invenfinder.loans
				      join invenfinder.users on loans.userID=users.id
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
			`select loans.id as id, userID, itemID, amount, approved, username
			 from invenfinder.loans
				      join invenfinder.users on loans.userID=users.id
			 where itemID=?`,
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
			`select loans.id as id, userID, itemID, loans.amount, approved, items.name as itemName
			 from invenfinder.loans
				      join invenfinder.items on loans.itemID=items.id
			 where userID=?`,
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
			`select loans.id as id, userID, itemID, amount, approved
			 from invenfinder.loans
			 where itemID=?
				 and userID=?`,
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
