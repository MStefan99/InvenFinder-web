import appState from './store';

type User = {
	id: number;
	username: string;
	permissions: number;
};

type Item = {
	id: number;
	name: string;
	description: string | null;
	location: string;
	amount: number;
};

type ApiManager = {
	items: {
		getAll: () => Promise<Item[]>;
		getByID: () => Promise<Item | null>;
		getByLocation: () => Promise<Item | null>;
	};
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => Promise<boolean>;
	me: () => Promise<User | null>;
};

const apiPrefix = '/api';

export default {
	items: {
		async getAll(): Promise<Item[]> {
			return new Promise((resolve, reject) => {
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
							reject();
						}
					})
					.then((items) => resolve(items as Item[]))
					.catch(() => {
						console.warn('Load item request failed');
					});
			});
		},
		async getByID(): Promise<Item | null> {
			return Promise.resolve(null);
		},
		async getByLocation(): Promise<Item | null> {
			return Promise.resolve(null);
		}
	},
	async login(username: string, password: string): Promise<boolean> {
		return new Promise((resolve) => {
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
						res.json().then((data) => console.warn('Could not log in:', data.error));
						resolve(false);
					}
				})
				.then((data) => {
					appState.setApiKey(data.key);
					resolve(true);
				})
				.catch(() => {
					console.warn('Login request failed');
					resolve(false);
				});
		});
	},
	async logout(): Promise<boolean> {
		return new Promise((resolve) => {
			fetch(appState.backendURL + '/api/auth/logout', {
				headers: {
					'API-Key': appState.apiKey
				}
			})
				.then((res) => {
					if (res.ok) {
						appState.setApiKey(null);
						resolve(true);
					} else {
						console.warn('Could not log out');
						resolve(false);
					}
				})
				.catch(() => {
					console.warn('Logout request failed');
					resolve(false);
				});
		});
	},
	async me(): Promise<User | null> {
		return new Promise((resolve) => {
			resolve(null);
		});
	}
} as ApiManager;
