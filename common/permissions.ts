export const enum PERMISSIONS {
	EDIT_ITEM_AMOUNT,
	MANAGE_ITEMS,
	LOAN_ITEMS,
	MANAGE_USERS
}

export function toNumber(permissions: PERMISSIONS[]): number {
	let val = 0;

	for (const p of permissions) {
		val |= 1 << p;
	}

	return val;
}

export function fromNumber(value: number): PERMISSIONS[] {
	const permissions = new Array<PERMISSIONS>();

	for (let i: PERMISSIONS = 0; value; i++) {
		if (value & 1) {
			permissions.push(i);
		}

		value >>= 1;
	}

	return permissions;
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

export function hasPermissions(
	requestedPermissions: PERMISSIONS[],
	grantedPermissions: PERMISSIONS[]
): boolean {
	const requestedValue = toNumber(requestedPermissions);
	const grantedValue = toNumber(grantedPermissions);

	// noinspection JSBitwiseOperatorUsage
	return (grantedValue & requestedValue) === requestedValue;
}
