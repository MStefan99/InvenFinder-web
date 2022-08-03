import appState from './store.ts';
import {User, Session, Item} from './types.ts';

export type ApiManager = {
	items: {
		getAll: () => Promise<Item[]>;
		getByID: (id: number) => Promise<Item | null>;
		getByLocation: (location: string) => Promise<Item | null>;
		editAmount: (id: number, amount: number) => Promise<Item | null>;
		edit: (item: Item) => Promise<Item | null>;
	};
	connection: {
		testURL: (url: string) => Promise<boolean>;
		test: () => Promise<boolean>;
	};
	auth: {
		login: (username: string, password: string) => Promise<boolean>;
		test: () => Promise<boolean>;
		me: () => Promise<User | null>;
		getSessions: () => Promise<Session[]>;
		logoutSession: (id: string) => Promise<boolean>;
		logoutAll: () => Promise<boolean>;
		logout: () => Promise<boolean>;
	};
};

const apiPrefix = '/api';
const notAuthenticated = {error: 'NO_AUTH', message: 'Not Authenticated'};
const requestFailed = {error: 'REQ_FAILED', message: 'Request failed'};

export default {
	items: {
		getAll(): Promise<Item[]> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
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
							res.json().then((err) => reject(err));
						}
					})
					.then((items) => resolve(items as Item[]))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		getByID(id: number): Promise<Item | null> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
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
							res.json().then((err) => reject(err));
						}
					})
					.then((items) => resolve(items as Item))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		getByLocation(): Promise<Item | null> {
			return Promise.resolve(null);
		},
		editAmount(id: number, amount: number): Promise<Item | null> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/items/' + id + '/amount', {
					method: 'PUT',
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
							res.json().then((err) => reject(err));
						}
					})
					.then((item) => resolve(item as Item))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		edit(item: Item): Promise<Item | null> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/items/' + item.id, {
					method: 'PATCH',
					headers: {
						'API-Key': appState.apiKey,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(item)
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => reject(err));
						}
					})
					.then((item) => resolve(item as Item))
					.catch(() => {
						reject(requestFailed);
					});
			});
		}
	},
	connection: {
		testURL(url: string): Promise<boolean> {
			return new Promise((resolve, reject) => {
				fetch(url + apiPrefix)
					.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		test(): Promise<boolean> {
			return new Promise((resolve, reject) => {
				fetch(appState.backendURL + apiPrefix)
					.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
					.catch(() => {
						reject(requestFailed);
					});
			});
		}
	},
	auth: {
		login(username: string, password: string): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/login', {
					method: 'POST',
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
							res.json().then((err) => reject(err));
						}
					})
					.then((data) => {
						appState.setApiKey(data.key);
						appState.setUser(new User(data.user.id, data.user.username, data.user.permissions));
						resolve(!!data.key);
					})
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		test(): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/auth', {
					headers: {
						'Api-Key': appState.apiKey
					}
				})
					.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		me(): Promise<User | null> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
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
							res.json().then((err) => reject(err));
						}
					})
					.then((user) => resolve(new User(user.id, user.username, user.permissions)))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		getSessions(): Promise<Session[]> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/sessions', {
					headers: {
						'Api-Key': appState.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => reject(err));
						}
					})
					.then((session) => resolve(session as Session))
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		logoutSession(id: string): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/sessions/' + id, {
					method: 'DELETE',
					headers: {
						'Api-Key': appState.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							if (id === appState.apiKey) {
								appState.setApiKey(null);
								appState.setUser(null);
							}
							resolve(true);
						} else {
							res.json().then((err) => reject(err));
						}
					})
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		logoutAll(): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/sessions', {
					method: 'DELETE',
					headers: {
						'API-Key': appState.apiKey
					}
				})
					.then((res) => {
						appState.setApiKey(null);
						appState.setUser(null);

						if (res.ok) {
							resolve(true);
						} else {
							res.json().then((err) => reject(err));
						}
					})
					.catch(() => {
						reject(requestFailed);
					});
			});
		},
		logout(): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (!appState.backendURL || !appState.apiKey) {
					reject(notAuthenticated);
				}

				fetch(appState.backendURL + apiPrefix + '/logout', {
					headers: {
						'API-Key': appState.apiKey
					}
				})
					.then((res) => {
						appState.setApiKey(null);
						appState.setUser(null);

						if (res.ok) {
							resolve(true);
						} else {
							res.json().then((err) => reject(err));
						}
					})
					.catch(() => {
						reject(requestFailed);
					});
			});
		}
	}
} as ApiManager;
