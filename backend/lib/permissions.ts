enum PERMISSIONS {
	'EDIT_ITEM_AMOUNT',
	'MANAGE_ITEMS',
	'LOAN_ITEMS',
	'MANAGE_USERS'
}


export default {
	PERMISSIONS,


	getPermissionValue(permissions: [PERMISSIONS]) {
		let val = 0;

		for (const p of permissions) {
			val |= 1 << p;
		}

		return val;
	}
};
