import { initDB } from './db.ts';
import { initSSO } from './sso.ts';

export function init() {
	return Promise.all([initDB(), initSSO()]);
}
