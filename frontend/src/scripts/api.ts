import appState from './store';
import type {User, Session, Item, NewUser, NewItem, UpdateUser} from './types';

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

const apiPrefix = '/api';
const notConfigured = {error: 'NOT_CONFIGURED', message: 'Not configured'} as ErrorResponse;
const notAuthenticated = {
	error: 'NOT_AUTHENTICATED',
	message: 'You must sign in to do this'
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
	query?: Record<string, string>;
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

		const query = params?.query ? '?' + new URLSearchParams(params.query).toString() : '';

		fetch(appState.backendURL + apiPrefix + path + query, {
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
			return;
		}

		fetch(host + apiPrefix)
			.then((res) => resolve(res.ok && res.headers.get('who-am-i') === 'Invenfinder'))
			.catch(() => {
				reject(requestFailed);
			});
	});
}

function booleanify(promise: Promise<unknown>): Promise<boolean> {
	return new Promise((resolve, reject) =>
		promise.then((res) => resolve(!!res)).catch((err) => reject(err))
	);
}

export const ConnectionAPI = {
	testURL: (host: string | null) => connect(host),
	test: () => connect(appState.backendURL)
};

export const AuthAPI = {
	login: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResult>('/login', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	register: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResult>('/register', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	test: () => booleanify(request('/auth', {auth: true})),
	me: () => request<User>('/me', {auth: true}),
	edit: (user: UpdateUser) =>
		request<User>('/me', {auth: true, method: RequestMethod.PATCH, body: user}),
	logout: () =>
		new Promise<boolean>((resolve, reject) => {
			request<MessageResponse>('/logout', {
				auth: true
			})
				.then(() => {
					appState.setApiKey(null);
					appState.setUser(null);
					resolve(true);
				})
				.catch((err) => reject(err));
		})
};

export const SessionAPI = {
	getAll: () => request<Session[]>('/sessions', {auth: true}),
	logout: (id: Session['id']) =>
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
	add: (item: NewItem) =>
		request<Item>('/items', {auth: true, method: RequestMethod.POST, body: item}),
	getAll: () => request<Item[]>('/items', {auth: true}),
	getByID: (id: Item['id']) => request<Item>('/items/' + id, {auth: true}),
	getByLocation: () => Promise.reject<Item>(notImplemented),
	editAmount: (id: Item['id'], amount: Item['amount']) =>
		request<Item>('/items/' + id + '/amount', {
			auth: true,
			method: RequestMethod.PUT,
			body: {amount}
		}),
	edit: (item: Item) =>
		request<Item>('/items/' + item.id, {auth: true, method: RequestMethod.PATCH, body: item}),
	delete: (item: Item) =>
		booleanify(request<Item>('/items/' + item.id, {auth: true, method: RequestMethod.DELETE}))
};

export const UserAPI = {
	add: (user: NewUser) =>
		request<User>('/users', {auth: true, method: RequestMethod.POST, body: user}),
	getAll: () => request<User[]>('/users', {auth: true}),
	getByID: (id: User['id']) => request<User>('/users/' + id, {auth: true}),
	getByUsername: (username: User['username']) =>
		request<User>('/users/username/' + username, {auth: true}),
	edit: (user: UpdateUser) =>
		request<User>('/users/' + user.id, {auth: true, method: RequestMethod.PATCH, body: user}),
	delete: (user: User) =>
		booleanify(
			request<User>('/users/' + user.id, {
				auth: true,
				method: RequestMethod.DELETE
			})
		)
};

export default {
	connection: ConnectionAPI,
	sessions: SessionAPI,
	auth: AuthAPI,
	items: ItemAPI,
	users: UserAPI
};
