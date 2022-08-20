import appState from './store';
import {User, Session, Item} from './types';

type MessageResponse = {
	code: string;
	message: string;
};

type ErrorResponse = {
	error: string;
	message: string;
};

type AuthResult = {
	user: User;
	key: string;
};

export type ApiManager = {
	connection: {
		testURL: (url: string | null) => Promise<boolean>;
		test: () => Promise<boolean>;
	};
	sessions: {
		getAll: () => Promise<Session[]>;
		logout: (id: string) => Promise<boolean>;
		logoutAll: () => Promise<boolean>;
	};
	auth: {
		login: (username: string, password: string) => Promise<User>;
		test: () => Promise<boolean>;
		me: () => Promise<User>;
		logout: () => Promise<boolean>;
	};
	items: {
		getAll: () => Promise<Item[]>;
		getByID: (id: number) => Promise<Item>;
		getByLocation: (location: string) => Promise<Item>;
		editAmount: (id: number, amount: number) => Promise<Item>;
		edit: (item: Item) => Promise<Item>;
	};
};

const apiPrefix = '/api';
const notConfigured = {error: 'NOT_CONFIGURED', message: 'Not configured'} as ErrorResponse;
const notAuthenticated = {
	error: 'NOT_AUTHENTICATED',
	message: 'Not authenticated'
} as ErrorResponse;
const requestFailed = {error: 'REQ_FAILED', message: 'Request failed'} as ErrorResponse;
const notImplemented = {error: 'NOT_IMPLEMENTED', message: 'Not implemented'} as ErrorResponse;

enum RequestMethod {
	GET = 'GET',
	POST = 'POST',
	PATCH = 'PATCH',
	PUT = 'PUT',
	DELETE = 'DELETE'
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
			return;
		}

		if (params.auth && !appState.apiKey) {
			reject(notAuthenticated);
			return;
		}

		fetch(appState.backendURL + apiPrefix + path, {
			method: params.method ?? 'GET',
			headers: {
				...(!!params.auth && {
					'API-Key': appState.apiKey as string // Safe because of an if condition above
				}),
				...(params.method !== RequestMethod.GET && {
					'Content-Type': 'application/json'
				})
			},
			...(!!params.body && {body: JSON.stringify(params.body)})
		})
			.then((res) => {
				if (res.ok) {
					return res.json();
				} else {
					return res.json().then((err) => reject(err));
				}
			})
			.then((data) => resolve(data as T))
			.catch((err) => reject(err));
	});
}

function connect(host: string | null): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		if (!host) {
			reject(notConfigured);
		}

		fetch(host + apiPrefix)
			.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
			.catch(() => {
				reject(requestFailed);
			});
	});
}

function booleanify(val: Promise<unknown>): Promise<boolean> {
	return new Promise((resolve) => val.then((res) => resolve(!!res)));
}

export const ConnectionAPI = {
	testURL: (host: string | null) => connect(host),
	test: () => connect(appState.backendURL)
};

export const AuthAPI = {
	login: (username: string, password: string) =>
		new Promise<User>((resolve) => {
			request<AuthResult>('/login', {method: RequestMethod.POST, body: {username, password}}).then(
				(data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				}
			);
		}),
	test: () => booleanify(request('/auth', {auth: true})),
	me: () => request<User>('/me', {auth: true}),
	logout: () =>
		new Promise<boolean>((resolve) => {
			request<MessageResponse>('/logout', {
				auth: true
			}).then(() => {
				appState.setApiKey(null);
				appState.setUser(null);
				resolve(true);
			});
		})
};

export const SessionAPI = {
	getAll: () => request<Session[]>('/sessions', {auth: true}),
	logout: (id: string) =>
		booleanify(
			request<MessageResponse>('/sessions/' + id, {
				auth: true,
				method: RequestMethod.DELETE
			})
		),
	logoutAll: () =>
		booleanify(request<MessageResponse>('/sessions', {auth: true, method: RequestMethod.DELETE}))
};

export const ItemAPI = {
	getAll: () => request<Item[]>('/items', {auth: true}),
	getByID: (id: number) => request<Item>('/items/' + id, {auth: true}),
	getByLocation: () => Promise.reject<Item>(notImplemented),
	editAmount: (id: number, amount: number) =>
		request<Item>('/items/' + id, {
			auth: true,
			method: RequestMethod.PUT,
			body: {amount}
		}),
	edit: (item: Item) =>
		request<Item>('/items/' + item.id, {auth: true, method: RequestMethod.PATCH, body: item})
};

export default {
	connection: ConnectionAPI,
	sessions: SessionAPI,
	auth: AuthAPI,
	items: ItemAPI
} as ApiManager;
