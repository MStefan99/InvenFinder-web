import appState from './store';
import type {
	User,
	Session,
	Item,
	NewUser,
	NewItem,
	UpdateUser,
	Loan,
	ItemLoan,
	UserLoan,
	EditLoan
} from './types';

type MessageResponse = {
	code: string;
	message: string;
};

export type ErrorResponse = {
	error: string;
	message: string;
};

type AuthResponse = {
	user: User;
	key: string;
};

type SettingsResponse = {
	crashCourse: {
		url: string | null;
		key: string | null;
	};
	features: {
		accounts: boolean;
		uploads: boolean;
		loans: boolean;
	};
};

const apiPrefix = import.meta.env.VUE_API_PREFIX || '';
const notConfigured: ErrorResponse = {error: 'NOT_CONFIGURED', message: 'Not configured'};
const notAuthenticated: ErrorResponse = {
	error: 'NOT_AUTHENTICATED',
	message: 'You must sign in to do this'
};
const requestFailed: ErrorResponse = {error: 'REQ_FAILED', message: 'Request failed'};
const notImplemented: ErrorResponse = {error: 'NOT_IMPLEMENTED', message: 'Not implemented'};

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
	credentials?: true;
};

function request<T>(path: string, params?: RequestParams): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!appState.backendURL) {
			reject(notConfigured);
			return;
		}

		if (params?.auth && !appState.apiKey) {
			reject(notAuthenticated);
			return;
		}

		const query =
			params?.query &&
			Object.keys(params?.query).reduce<Record<string, string>>((q, key) => {
				params.query?.[key].trim() && (q[key] = params.query[key]);
				return q;
			}, {});
		const queryString =
			query && Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '';

		fetch(appState.backendURL + apiPrefix + path + queryString, {
			method: params?.method ?? 'GET',
			headers: {
				...(!!params?.auth && {
					'API-Key': appState.apiKey as string // Safe because of an if condition above
				}),
				...(!!params?.auth &&
					appState.ssoURL?.length && {
						'SSO-URL': appState.ssoURL as string
					}),
				...(params?.method !== RequestMethod.GET && {
					'Content-Type': 'application/json'
				})
			},
			...(params?.credentials && {credentials: 'include'}),
			...(!!params?.body && {body: JSON.stringify(params.body)})
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
	test: () => connect(appState.backendURL),
	settings: () => request<SettingsResponse>('/settings')
};

export const AuthAPI = {
	login: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResponse>('/login', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					appState.setSSOURL(null);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	register: (username: User['username'], password: NewUser['password']) =>
		new Promise<User>((resolve, reject) => {
			request<AuthResponse>('/register', {method: RequestMethod.POST, body: {username, password}})
				.then((data) => {
					appState.setApiKey(data.key);
					appState.setUser(data.user);
					appState.setSSOURL(null);
					resolve(data.user);
				})
				.catch((err) => reject(err));
		}),
	test: () => booleanify(request('/auth', {auth: true})),
	me: () => request<User>('/me', {auth: true}),
	getCookie: () => request<MessageResponse>('/get-cookie', {auth: true, credentials: true}),
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
					appState.setSSOURL(null);
					resolve(true);
				})
				.catch((err) => reject(err));
		}),
	delete: () => request<User>('/me', {auth: true, method: RequestMethod.DELETE})
};

export const SessionAPI = {
	getAll: () => request<Session[]>('/sessions', {auth: true}),
	logout: (id: Session['id']) =>
		request<Session>('/sessions/' + id, {
			auth: true,
			method: RequestMethod.DELETE
		}),
	logoutAll: () =>
		booleanify(request<MessageResponse>('/sessions', {auth: true, method: RequestMethod.DELETE}))
};

export const ItemAPI = {
	add: (item: NewItem) =>
		request<Item>('/items', {auth: true, method: RequestMethod.POST, body: item}),
	getAll: () => request<Item[]>('/items', {auth: true}),
	search: (query: string) =>
		request<Item[]>('/items', {auth: true, query: {q: query, boolean: 'true'}}),
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

export const LoanAPI = {
	add: (itemID: Item['id'], amount: Loan['amount']) =>
		request<Loan>('/items/' + itemID + '/loans', {
			auth: true,
			method: RequestMethod.POST,
			body: {amount}
		}),
	getMine: () => request<ItemLoan[]>('/loans/mine', {auth: true}),
	getMineByItem: (itemID: Item['id']) =>
		request<Loan[]>('/items/' + itemID + '/loans/mine', {auth: true}),
	getByItem: (itemID: Item['id']) =>
		request<UserLoan[]>('/items/' + itemID + '/loans', {auth: true}),
	getByUser: (userID: User['id']) =>
		request<ItemLoan[]>('/users/' + userID + '/loans', {auth: true}),
	edit: (loan: Loan) =>
		request<EditLoan>('/loans/' + loan.id, {auth: true, method: RequestMethod.PATCH, body: loan}),
	delete: (loan: Loan, returned?: boolean) =>
		request<Loan>('/loans/' + loan.id, {auth: true, method: RequestMethod.DELETE, body: {returned}})
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
	loans: LoanAPI,
	users: UserAPI
};
