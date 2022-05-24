'use strict';

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());


app.set('x-powered-by', false);


app.get('/', (req, res) => {
	res.send("Hello Express!");
});


app.listen(3007, () => {
	console.log('Listening on port ', 3007);  // TODO: get port
});
