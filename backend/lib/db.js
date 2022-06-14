'use strict';

const mariadb = require('mariadb');

const conn = mariadb.createConnection({
	host: process.env.DB_URL,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: 'invenfinder',
});

module.exports = conn;
