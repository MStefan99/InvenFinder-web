'use strict';

function makeEnum(obj) {
	let i = 0;
	const map = new Map();

	for (const prop in obj) {
		if (!map.has(prop)) {
			map.set(i, prop);
			obj[prop] = i;
		} else {
			delete obj[prop];
		}

		++i;
	}

	return Object.freeze(map);
}

const PERMISSIONS = {
	'EDIT_ITEM_AMOUNT': 0,
	'MANAGE_ITEMS': 0,
	'LOAN_ITEMS': 0,
	'MANAGE_USERS': 0
};

// For later use
const permissionEnum = makeEnum(PERMISSIONS);


module.exports = {
	PERMISSIONS,


	getPermissionValue(permissions) {
		let val = 0;

		for (const p of permissions) {
			val |= 1 << p;
		}

		return val;
	}
};
