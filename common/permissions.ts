export enum PERMISSIONS {
	EDIT_ITEM_AMOUNT,
	MANAGE_ITEMS,
	MANAGE_USERS
}

export const permissionDescriptions: Record<PERMISSIONS, string> = {
	[PERMISSIONS.EDIT_ITEM_AMOUNT]: 'Edit item amount',
	[PERMISSIONS.MANAGE_ITEMS]: 'Edit items',
	[PERMISSIONS.MANAGE_USERS]: 'Edit users'
};

function fromNumber(value: number): PERMISSIONS[] {
	const permissions = new Array<PERMISSIONS>();

	for (let i: PERMISSIONS = 0; value; i++) {
		if (value & 1) {
			permissions.push(i);
		}

		value >>= 1;
	}

	return permissions;
}

function toNumber(permissions: PERMISSIONS[]): number {
	let val = 0;

	for (const p of permissions) {
		val |= 1 << p;
	}

	return val;
}

export function revokePermissions(
	current: number | PERMISSIONS[],
	revoke: number | PERMISSIONS[]
): PERMISSIONS[] {
	const currentValue = encodePermissions(current);
	const revokeValue = encodePermissions(revoke);

	return parsePermissions(currentValue & ~revokeValue);
}

export function grantPermissions(
	current: number | PERMISSIONS[],
	grant: number | PERMISSIONS[]
): PERMISSIONS[] {
	const currentValue = encodePermissions(current);
	const grantValue = encodePermissions(grant);

	return parsePermissions(currentValue | grantValue);
}

export function parsePermissions(p: number | PERMISSIONS[] | undefined): PERMISSIONS[] {
	if (!p) {
		return [];
	} else if (Array.isArray(p)) {
		return p;
	} else if (Number.isInteger(p)) {
		return fromNumber(p);
	} else {
		return [];
	}
}

export function encodePermissions(p: number | PERMISSIONS[] | undefined): number {
	if (!p) {
		return 0;
	} else if (Array.isArray(p)) {
		return toNumber(p);
	} else if (Number.isInteger(p)) {
		return p;
	} else {
		return 0;
	}
}

export function hasPermissions(
	requestedPermissions: number | PERMISSIONS[],
	grantedPermissions: number | PERMISSIONS[]
): boolean {
	const requestedValue = encodePermissions(requestedPermissions);
	const grantedValue = encodePermissions(grantedPermissions);

	return (grantedValue & requestedValue) === requestedValue;
}
