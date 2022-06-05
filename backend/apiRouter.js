'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const User = require('./lib/user');
const Session = require('./lib/session');
const {PERMISSIONS} = require('./lib/permissions');
const auth = require('./lib/auth');
const connectionPromise = require('./lib/db');


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


router.get('/items',
	auth.authenticated(),
	async (req, res) => {
		const connection = await connectionPromise;

		res.json(await connection.query(`select *
		                                 from invenfinder.items`));
	});


router.get('/items/:id',
	auth.authenticated(),
	async (req, res) => {
		const id = +req.params.id;

		if (!id) {
			res
				.status(400)
				.json({error: 'Invalid ID'});
			return;
		}

		const connection = await connectionPromise;
		res.json(await connection.query(`select *
		                                 from invenfinder.items
		                                 where id=?`, [id]));
	});


router.put('/items/:id/amount',
	auth.permissions(PERMISSIONS.EDIT_ITEM_AMOUNT),
	async (req, res) => {
		const id = +req.params.id;
		const amount = +req.body.amount;

		if (!id) {
			res
				.status(400)
				.json({error: 'Invalid ID'});
			return;
		}

		if (!amount || amount < 0) {
			res
				.status(400)
				.json({error: 'Invalid amount'});
			return;
		}

		const connection = await connectionPromise;
		connection.query(`update invenfinder.items
		                  set amount=?
		                  where id=?`,
			[amount, id]);

		res
			.json({message: 'OK'});
	});


router.post('/items',
	auth.permissions(PERMISSIONS.MANAGE_ITEMS),
	async (req, res) => {
		const item = {
			name: req.body.name,
			description: req.body.description,
			location: Location.parsereq.body.location,
			amount: +req.body.amount
		};

		if (!item.name) {
			res.status(400).json({error: 'No name provided'});
			return;
		}
		if (!item.location) {
			res.status(400).json({error: 'No or invalid location provided'});
			return;
		}
		if (!Number.isInteger(item.amount)) {
			res.status(400).json({error: 'No or invalid amount provided'});
			return;
		}


	}
);


(async () => {
	const admin = await User.getUserByID(3);
	admin.username = 'admin';
})();


module.exports = router;
