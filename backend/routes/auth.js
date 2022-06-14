'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const User = require('../lib/user');
const Session = require('../lib/session');

const auth = require('../lib/auth');

const router = express.Router();

router.use(bodyParser.json());

if (process.env.NODE_ENV === 'development') {
	router.use(cors());
}

router.get('/', (req, res) => {
	res.json({ message: 'Welcome!' });
});

router.post('/login', async (req, res) => {
	if (!req.body.username || !req.body.password) {
		res.status(400).json({ error: 'No username or password provided' });
		return;
	}

	const user = await User.getByUsername(req.body.username);
	if (!user) {
		res.status(400).json({ error: 'User not found' });
		return;
	} else if (!await user.verifyPassword(req.body.password)) {
		res.status(403).json({ error: 'Incorrect password' });
		return;
	}

	const session = await Session.create(user, req.get('user-agent'), req.ip);

	res
		.status(201)
		.json({ key: session.publicID });
});

router.post('/register', async (req, res) => {
	if (!req.body.username || !req.body.password) {
		res.status(400).json({ error: 'No username or password provided' });
		return;
	}

	const user = await User.create({
		username: req.body.username,
		password: req.body.password,
	});
	const session = await Session.create(user, req.get('user-agent'), req.ip);

	res
		.status(201)
		.json({ key: session.publicID });
});

router.get('/logout', auth.authenticated(), (req, res) => {
	res.json({ message: 'OK' });

	req.session.delete();
});

module.exports = router;
