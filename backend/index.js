'use strict';

const path = require('path');

const express = require('express');
const cors = require('cors');
const apiRouter = require('./apiRouter');

const app = express();


if (process.env.NODE_ENV === 'development') {
	app.use(cors());
}


app.set('x-powered-by', false);
app.use('/', express.static(path.resolve(__dirname, '..', 'frontend', 'dist')));

app.use('/api', apiRouter);


app.listen(3007, () => {
	console.log('Listening on port ', 3007);  // TODO: get port
});
