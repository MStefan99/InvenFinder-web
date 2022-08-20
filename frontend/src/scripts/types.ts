export type User = {
	id: number;
	username: string;
	permissions: number;
};

export type Session = {
	id: string;
	ip: string;
	ua: string;
	time: number;
};

export type Item = {
	id: number;
	name: string;
	description: string | null;
	link: string | null;
	location: string;
	amount: number;
};
