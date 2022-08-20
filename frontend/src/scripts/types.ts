import {parsePermissions, PERMISSIONS} from '../../../common/permissions';

export class User {
	id: number;
	username: string;
	permissions: PERMISSIONS[];

	constructor(id: number, username: string, permissions: number) {
		this.id = id;
		this.username = username;
		this.permissions = parsePermissions(permissions);
	}
}

export class Session {
	id: string;
	ip: string;
	ua: string;
	time: number;
}

export type Item = {
	id: number;
	name: string;
	description: string | null;
	link: string | null;
	location: string;
	amount: number;
};
