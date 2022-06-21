export enum PERMISSIONS {
	'EDIT_ITEM_AMOUNT',
	'MANAGE_ITEMS',
	'LOAN_ITEMS',
	'MANAGE_USERS',
}

export function getPermissionValue(permissions: [PERMISSIONS]): number {
	let val = 0;

	for (const p of permissions) {
		val |= 1 << p;
	}

	return val;
}
