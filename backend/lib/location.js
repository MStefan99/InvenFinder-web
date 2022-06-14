'use strict';

function colEncode(n) {
	n = +n;

	if (n === null || n === undefined || Number.isNaN(n) || n < 0) {
		return null;
	}

	let str = '';
	let col = n + 1;

	while (col > 0) {
		const digit = col % 26;

		if (digit === 0) {
			str = 'Z' + str;
			col = Math.floor(col / 26) - 1;
		} else {
			const value = digit + 64;
			str = String.fromCharCode(value) + str;
			col = Math.floor(col / 26);
		}
	}

	return str;
}

function colDecode(str) {
	if (!str) {
		return null;
	}

	let n = 0;

	for (let i = 0; i < str.length - 1; ++i) {
		n += Math.pow(26, str.length - i - 1) * (str.charCodeAt(i) - 64);
	}
	n += str.charCodeAt(str.length - 1) - 65;

	return n;
}

class Location {
	cabinet;
	col;
	row;

	constructor(cabinet, col, row) {
		this.cabinet = cabinet;
		this.col = col;
		this.row = row;
	}

	toString() {
		return (this.cabinet + 1) +
			'-' + colEncode(this.col) +
			(this.row + 1);
	}

	static parse(str) {
		const location = new Location();
		const groups = str.match(/^(\d+)-([A-Z]+)(\d+)$/);

		if (!groups) {
			return null;
		}

		location.cabinet = groups[1] - 1;
		location.col = colDecode(groups[2]);
		location.row = groups[3] - 1;

		return location;
	}
}

module.exports = Location;
