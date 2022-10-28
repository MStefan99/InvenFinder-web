import { Router } from '../deps.ts';

import auth from '../lib/auth.ts';
import Loan from '../lib/loan.ts';
import User from '../lib/user.ts';
import Item from '../lib/item.ts';

const router = new Router({
	prefix: '/loans',
});

// Loan requests are added through an item router

export default router;
