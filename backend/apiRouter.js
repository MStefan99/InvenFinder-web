'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const User = require('./lib/user');
const Session = require('./lib/session');
const {PERMISSIONS} = require('./lib/permissions');
const auth = require('./lib/auth');


const router = express.Router();

router.use(bodyParser.json());

if (process.env.NODE_ENV === 'development') {
	router.use(cors());
}


router.get('/', (req, res) => {
	res.json({message: 'Welcome!'});
});


router.post('/login', async (req, res) => {
	if (!req.body.username || !req.body.password) {
		res.status(400).json({error: 'No username or password provided'});
		return;
	}

	const user = await User.getUserByUsername(req.body.username);
	if (!user) {
		res.status(400).json({error: 'User not found'});
		return;
	} else if (!await user.verifyPassword(req.body.password)) {
		res.status(403).json({error: 'Incorrect password'});
		return;
	}

	const session = await Session.createSession(user, req.get('user-agent'), req.ip);

	res
		.status(201)
		.json({key: session.publicID});
});


router.post('/register', async (req, res) => {
	if (!req.body.username || !req.body.password) {
		res.status(400).json({error: 'No username or password provided'});
		return;
	}

	const user = await User.createUser(req.body.username, req.body.password);
	const session = await Session.createSession(user, req.get('user-agent'), req.ip);

	res
		.status(201)
		.json({key: session.publicID});
});


router.get('/logout',
	auth.authenticated(),
	(req, res) => {
		res.sendStatus(200);

		req.session.delete();
	});


router.get('/permissions',
	auth.authenticated(),
	auth.hasPermissions([PERMISSIONS.EDIT_ITEM_AMOUNT]),
	(req, res) => {
		res.json({message: 'permissions!'});
	});


module.exports = router;
