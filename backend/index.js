'use strict';

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());


app.set('x-powered-by', false);


app.get('/', (req, res) => {
	res.send("Hello Express!");
});


db.then(async conn => {
	console.log("Items:", await conn.query('select * from components'));
});


app.listen(3007, () => {
	console.log('Listening on port ', 3007);  // TODO: get port
});
