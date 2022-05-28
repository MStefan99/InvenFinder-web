'use strict';

const Session = require('./session');
const User = require('./user');


function makeEnum(array) {
	let i = 0;
	let map = new Map();

	for (const prop in array) {
		if (!map.has(prop)) {
			map.set(prop, 1 << i++);
		}
	}

	return Object.freeze(map);
}


const PERMISSIONS = {
	'READ_DB': 0,
	'WRITE_DB': 0
};

const permissionEnum = makeEnum(PERMISSIONS);


function getPermissionValue(permissions) {
	let val = 0;

	for (const p of permissions) {
		val &= permissionEnum.get('p');
	}

	return val;
}


async function getSession(req) {
	if (req.session) {
		return req.session;
	}

	const id = req.cookies?.SID ?? req.get('api-key');
	if (!id) {
		return null;
	}

	return req.session = await Session.getSessionByPublicID(id);
}


async function getUser(req) {
	if (req.user) {
		return req.user;
	}

	if (!req.session) {
		await getSession(req);
	}

	return req.user = await User.getUserByID(req.session.userID);
}


module.exports = {
	PERMISSIONS,


	authenticated() {
		return async (req, res, next) => {
			if (!await getSession(req)) {
				res
					.status(401)
					.json({error: 'Not authenticated'});
				return;
			}

			next();
		};
	},


	hasPermissions(permissions) {
		const permissionValue = getPermissionValue(permissions);

		return async (req, res, next) => {
			// noinspection JSBitwiseOperatorUsage
			if ((await getUser(req)).permissions & permissionValue === permissionValue) {
				next();
			} else {
				res.status(403).json({error: 'Not authorized'});
			}
		};
	}
};
