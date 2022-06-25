import appState from './store';

export type User = {
	id: number;
	username: string;
	permissions: number;
};

export type Item = {
	id: number;
	name: string;
	description: string | null;
	location: string;
	amount: number;
};

export type ApiManager = {
	items: {
		getAll: () => Promise<Item[]>;
		getByID: (id: number) => Promise<Item | null>;
		getByLocation: (location: string) => Promise<Item | null>;
	};
	login: (username: string, password: string) => Promise<string | null>;
	logout: () => Promise<boolean>;
	testURL: (url: string) => Promise<boolean>;
	test: () => Promise<boolean>;
	auth: () => Promise<boolean>;
	me: () => Promise<User | null>;
};

const apiPrefix = '/api';

export default {
	items: {
		async getAll(): Promise<Item[]> {
			if (appState.data.backendURL === null || appState.data.apiKey === null) {
				return [];
			}

			return new Promise((resolve, reject) => {
				fetch(appState.data.backendURL + apiPrefix + '/items', {
					headers: {
						'API-Key': appState.data.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => console.warn('Could not load items:', err.error));
							reject();
						}
					})
					.then((items) => resolve(items as Item[]))
					.catch(() => {
						console.warn('Load items request failed');
					});
			});
		},
		async getByID(id: number): Promise<Item | null> {
			if (appState.data.backendURL === null || appState.data.apiKey === null) {
				return null;
			}

			return new Promise((resolve, reject) => {
				fetch(appState.data.backendURL + apiPrefix + '/items/' + id, {
					headers: {
						'API-Key': appState.data.apiKey
					}
				})
					.then((res) => {
						if (res.ok) {
							return res.json();
						} else {
							res.json().then((err) => console.warn('Could not load item:', err.error));
							reject();
						}
					})
					.then((items) => resolve(items as Item))
					.catch(() => {
						console.warn('Load item request failed');
					});
			});
		},
		async getByLocation(): Promise<Item | null> {
			return null;
		}
	},
	async login(username: string, password: string): Promise<string | null> {
		if (appState.data.backendURL === null) {
			return null;
		}

		return new Promise((resolve) => {
			fetch(appState.data.backendURL + apiPrefix + '/login', {
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
					resolve(data.key);
				})
				.catch(() => {
					console.warn('Login request failed');
					resolve(null);
				});
		});
	},
	async logout(): Promise<boolean> {
		if (appState.data.backendURL === null) {
			return false;
		}

		return new Promise((resolve) => {
			fetch(appState.data.backendURL + apiPrefix + '/logout', {
				headers: {
					'API-Key': appState.data.apiKey
				}
			})
				.then((res) => {
					if (res.ok) {
						appState.setApiKey(null);
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
	async testURL(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			fetch(url + apiPrefix)
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('URL test request failed');
					resolve(false);
				});
		});
	},
	async test(): Promise<boolean> {
		return new Promise((resolve) => {
			fetch(appState.data.backendURL + apiPrefix)
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('Test request failed');
					resolve(false);
				});
		});
	},
	async auth(): Promise<boolean> {
		if (appState.data.backendURL === null || appState.data.apiKey === null) {
			return false;
		}

		return new Promise((resolve) => {
			fetch(appState.data.backendURL + apiPrefix + '/auth', {
				headers: {
					'Api-Key': appState.data.apiKey
				}
			})
				.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
				.catch(() => {
					console.warn('Auth request failed');
					resolve(false);
				});
		});
	},
	async me(): Promise<User | null> {
		if (appState.data.backendURL === null || appState.data.apiKey === null) {
			return null;
		}

		return new Promise((resolve) => {
			fetch(appState.data.backendURL + apiPrefix + '/auth', {
				headers: {
					'Api-Key': appState.data.apiKey
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
				.then((user) => resolve(user))
				.catch(() => {
					console.warn('User request failed');
					resolve(null);
				});
		});
	}
} as ApiManager;
