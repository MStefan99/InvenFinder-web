import appState from './store';
import {User, Session, Item} from './types';

type AuthResult = {
	user: User;
	key: string;
};

export type ApiManager = {
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
	items: {
		getAll: () => Promise<Item[]>;
		getByID: (id: number) => Promise<Item | null>;
		getByLocation: (location: string) => Promise<Item | null>;
		editAmount: (id: number, amount: number) => Promise<Item | null>;
		edit: (item: Item) => Promise<Item | null>;
	};
};

const apiPrefix = '/api';
const notConfigured = {error: 'NOT_CONFIGURED', message: 'Not configured'};
const notAuthenticated = {error: 'NOT_AUTHENTICATED', message: 'Not authenticated'};
const requestFailed = {error: 'REQ_FAILED', message: 'Request failed'};
const notImplemented = {error: 'NOT_IMPLEMENTED', message: 'Not implemented'};

enum RequestMethod {
	GET = 'GET',
	POST = 'POST',
	PATCH = 'PATCH',
	PUT = 'PUT'
}

type RequestParams = {
	auth?: boolean;
	method?: RequestMethod;
	body?: unknown;
};

function request<T>(path: string, params: RequestParams): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!appState.backendURL) {
			reject(notConfigured);
		}

		if (params.auth || !appState.apiKey) {
			reject(notAuthenticated);
		}

		fetch(appState.backendURL + apiPrefix + path, {
			method: params.method ?? 'GET',
			headers: {
				...(params.auth && {
					'API-Key': appState.apiKey
				}),
				...(params.method !== RequestMethod.GET && {
					'Content-Type': 'application/json'
				})
			},
			...(params.body && {body: JSON.stringify(params.body)})
		})
			.then((res) => {
				if (res.ok) {
					return res.json();
				} else {
					res.json().then((err) => reject(err));
				}
			})
			.then((data) => resolve(data as T))
			.catch((err) => reject(err));
	});
}

function connect(host: string): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		fetch(host + apiPrefix)
			.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
			.catch(() => {
				reject(requestFailed);
			});
	});
}

export const ConnectionAPI = {
	testURL: (host: string) => connect(host),
	test: () => connect(appState.backendURL)
};

export const AuthAPI = {
	login: (username: string, password: string): Promise<User> =>
		new Promise<User>((resolve, reject) => {
			request<AuthResult>('/login', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		})
};

export const ItemAPI = {
	getAll: () => request<Item[]>('/items', {auth: true}),
	getById: (id: number) => request<Item>('/items/' + id, {auth: true}),
	getByLocation: () => Promise.reject(notImplemented),
	editAmount: (id: number, amount: number) =>
		request<Item>('/items/' + id, {
			auth: true,
			method: RequestMethod.PUT,
			body: {amount}
		})
};

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
					.then((session) => resolve(session as Session[]))
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
