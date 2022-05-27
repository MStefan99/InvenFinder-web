'use strict';

const Session = require('./session');
const User = require('./user');


async function getSession(req, res, next) {
	const id = req.cookies?.SID ?? req.get('api-key');

	if (!id) {
		next();
		return;
	}

	req.session = await Session.getSessionByPublicID(id);

	next();
}


async function getUser(req, res, next) {
	if (!req.session) {
		next();
		return;
	}

	req.user = await User.getUserByID(req.session.userID);

	next();
}


function redirectIfNotAuthenticated(req, res, next) {
	if (!req.session) {
		res.redirect(303, '/login');
		return;
	}

	next();
}


module.exports = {
	getUser,
	getSession,
	redirectIfNotAuthenticated
};
