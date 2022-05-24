'use strict';

const express = require('express');
const app = express();


app.get('/', (req, res) => {
	res.send("Hello Express!");
});


app.listen(3007, () => {
	console.log('Listening on port ', 3007);  // TODO: get port
});
