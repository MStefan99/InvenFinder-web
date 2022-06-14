'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const Item = require('../lib/item');
const Location = require('../lib/location');

const {PERMISSIONS} = require('../lib/permissions');
const auth = require('../lib/auth');


const router = express.Router();

router.use(bodyParser.json());


router.get('/items',
	auth.authenticated(),
	async (req, res) => {
		res.json(await Item.getAll());
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

		res.json(await Item.getByID(id));
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

		const item = await Item.getByID(id);
		item.amount = amount;

		res
			.json({message: 'OK'});
	});


router.post('/items',
	auth.permissions(PERMISSIONS.MANAGE_ITEMS),
	async (req, res) => {
		const props = {
			name: req.body.name,
			description: req.body.description,
			location: Location.parse(req.body.location),
			amount: +req.body.amount
		};

		if (!props.name) {
			res.status(400).json({error: 'No name provided'});
			return;
		}
		if (!props.location) {
			res.status(400).json({error: 'No or invalid location provided'});
			return;
		}
		if (!Number.isInteger(props.amount)) {
			res.status(400).json({error: 'No or invalid amount provided'});
			return;
		}

		const item = await Item.create(props);
		res.json(item);
	}
);


router.delete('/items/:id',
	auth.permissions(PERMISSIONS.MANAGE_ITEMS),
	async (req, res) => {
		const id = +req.params.id;

		if (!id) {
			res
				.status(400)
				.json({error: 'Invalid ID'});
			return;
		}

		const item = await Item.getByID(id);
		item.delete();

		res
			.json({message: 'OK'});
	}
);


module.exports = router;
