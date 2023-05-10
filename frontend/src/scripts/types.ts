type BaseUser = {
	username: string;
	permissions: number;
};

export type User = {
	id: number;
} & BaseUser;

export type NewUser = BaseUser & {
	password: string;
};

export type UpdateUser = {
	id: User['id'];
	username?: BaseUser['username'];
	password?: NewUser['password'];
	permissions?: BaseUser['permissions'];
};

export type Session = {
	id: string;
	ip: string;
	ua: string;
	time: number;
};

export type NewItem = {
	name: string;
	description: string | null;
	link: string | null;
	location: string;
	amount: number;
};

export type Item = {
	id: number;
} & NewItem;

export type LoanRequest = {
	userID: number;
	itemID: number;
	amount: number;
};

export type Loan = {
	id: number;
	approved: boolean;
} & LoanRequest;

export type UserLoan = {
	username: string;
} & Loan;

export type ItemLoan = {
	itemName: string;
} & Loan;
