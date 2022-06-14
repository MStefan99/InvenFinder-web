'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRouter = require('./routes/auth');
const itemRouter = require('./routes/items');

const router = express.Router();

router.use(bodyParser.json());


if (process.env.NODE_ENV === 'development') {
	router.use(cors());
}


router.get('/', (req, res) => {
	res.json({message: 'Welcome!'});
});


router.use('/auth', authRouter);
router.use('/items', itemRouter);


module.exports = router;
