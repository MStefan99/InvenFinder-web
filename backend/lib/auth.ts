import Session from './session.ts';
import User from './user.ts';

async function getSession(req) {
	if (req.session) {
		return req.session;
	}

	const id = req.cookies?.SID ?? req.get('api-key');
	if (!id) {
		return null;
	}

	return req.session = await Session.getByPublicID(id);
}

async function getUser(req) {
	if (req.user) {
		return req.user;
	}

	if (!req.session) {
		await getSession(req);
	}

	return req.user = await User.getByID(req.session.userID);
}


export default {
	authenticated() {
		return async (req, res, next) => {
			const session = await getSession(req);

			if (!session) {
				res
					.status(401)
					.json({ error: 'Not authenticated' });
				return;
			}

			next();
		};
	},

	permissions(permissions) {
		if (!(permissions instanceof Array)) {
			permissions = [permissions];
		}

		return async (req, res, next) => {
			const user = await getUser(req);
			if (!user) {
				res.status(401).json({ error: 'Not authenticated' });
			} else if (user.hasPermissions(permissions)) {
				next();
			} else {
				res.status(403).json({ error: 'Not authorized' });
			}
		};
	},
};
