import {parsePermissions, PERMISSIONS} from '../../../common/permissions.ts';

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

export type Item = {
	id: number;
	name: string;
	description: string | null;
	location: string;
	amount: number;
};
