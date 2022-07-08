import appState from './store.ts';
import {User, Item} from './types.ts';

export type ApiManager = {
	items: {
		getAll: () => Promise<Item[]>;
		getByID: (id: number) => Promise<Item | null>;
		getByLocation: (location: string) => Promise<Item | null>;
		editAmount: (id: number, amount: number) => Promise<Item | null>;
	};
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => Promise<boolean>;
	testURL: (url: string) => Promise<boolean>;
	test: () => Promise<boolean>;
	auth: () => Promise<boolean>;
	me: () => Promise<User | null>;
};

const apiPrefix = '/api';

export default {
	items: {
		getAll(): Promise<Item[]> {
			return new Promise((resolve) => {
				if (!appState.backendURL || !appState.apiKey) {
					resolve([]);
				}

				fetch(appState.backendURL + apiPrefix + '/items', {
					headers: {
						'API-Key': appState.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => console.warn('Could not load items:', err.error));
							resolve([]);
						}
					})
					.then((items) => resolve(items as Item[]))
					.catch(() => {
						console.warn('Load items request failed');
						resolve([]);
					});
			});
		},
		getByID(id: number): Promise<Item | null> {
			return new Promise((resolve) => {
				if (!appState.backendURL || !appState.apiKey) {
					resolve(null);
				}

				fetch(appState.backendURL + apiPrefix + '/items/' + id, {
					headers: {
						'API-Key': appState.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => console.warn('Could not load item:', err.error));
							resolve(null);
						}
					})
					.then((items) => resolve(items as Item))
					.catch(() => {
						console.warn('Load item request failed');
						resolve(null);
					});
			});
		},
		editAmount(id: number, amount: number): Promise<Item | null> {
			return new Promise((resolve) => {
				if (!appState.backendURL || !appState.apiKey) {
					resolve(null);
				}

				fetch(appState.backendURL + apiPrefix + '/items/' + id + '/amount', {
					method: 'put',
					headers: {
						'API-Key': appState.apiKey,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						amount
					})
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => console.warn('Could not edit item amount:', err.error));
							resolve(null);
						}
					})
					.then((item) => resolve(item as Item))
					.catch(() => {
						console.warn('Load item request failed');
						resolve(null);
					});
			});
		},
		getByLocation(): Promise<Item | null> {
			return Promise.resolve(null);
		}
	},
	login(username: string, password: string): Promise<boolean> {
		return new Promise((resolve) => {
			if (!appState.backendURL) {
				resolve(null);
			}

			fetch(appState.backendURL + apiPrefix + '/login', {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username,
					password
				})
			})
				.then((res) => {
					if (res.ok) {
						return res.json();
					} else {
						res.json().then((err) => console.warn('Could not log in:', err.error));
						resolve(null);
					}
				})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(new User(data.user.id, data.user.username, data.user.permissions));
					resolve(!!data.key);
				})
				.catch(() => {
					console.warn('Login request failed');
					resolve(null);
				});
		});
	},
	logout(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!appState.backendURL) {
				resolve(false);
			}

			fetch(appState.backendURL + apiPrefix + '/logout', {
				headers: {
					'API-Key': appState.apiKey
				}
			})
				.then((res) => {
					if (res.ok) {
						appState.setApiKey(null);
						appState.setUser(null);
						resolve(true);
					} else {
						res.json().then((err) => console.warn('Could not log out:', err.error));
						resolve(false);
					}
				})
				.catch(() => {
					console.warn('Logout request failed');
					resolve(false);
				});
		});
	},
	testURL(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			fetch(url + apiPrefix)
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('URL test request failed');
					resolve(false);
				});
		});
	},
	test(): Promise<boolean> {
		return new Promise((resolve) => {
			fetch(appState.backendURL + apiPrefix)
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('Test request failed');
					resolve(false);
				});
		});
	},
	auth(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!appState.backendURL || !appState.apiKey) {
				resolve(false);
			}

			fetch(appState.backendURL + apiPrefix + '/auth', {
				headers: {
					'Api-Key': appState.apiKey
				}
			})
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('Auth request failed');
					resolve(false);
				});
		});
	},
	me(): Promise<User | null> {
		return new Promise((resolve) => {
			if (!appState.backendURL || !appState.apiKey) {
				resolve(null);
			}

			fetch(appState.backendURL + apiPrefix + '/me', {
				headers: {
					'Api-Key': appState.apiKey
				}
			})
				.then((res) => {
					if (res.ok) {
						return res.json();
					} else {
						res.json().then((err) => console.warn('Could not get current user:', err.error));
						resolve(null);
					}
				})
				.then((user) => resolve(new User(user.id, user.username, user.permissions)))
				.catch(() => {
					console.warn('User request failed');
					resolve(null);
				});
		});
	}
} as ApiManager;
