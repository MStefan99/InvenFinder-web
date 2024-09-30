import {reactive} from 'vue';

import type {User} from './types';
import {hasPermissions, PERMISSIONS} from '../../../common/permissions';
import Api, {ErrorResponse} from './api';

type CrashCourse = {
	sendLog: (message: string, level: number, tag?: string) => Promise<ErrorResponse | void>;
	sendFeedback: (message: string) => Promise<ErrorResponse | void>;
	sendHit: () => Promise<ErrorResponse | void>;
};

type Store = {
	backendURL: string | null;
	apiKey: string | null;
	ssoURL: string | null;
	user: User | null;
	crashCourse: CrashCourse | null;
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	setSSOURL: (sso: string | null) => void;
	setUser: (user: User | null) => void;
	hasPermissions: (permissions: PERMISSIONS[], any?: boolean) => boolean;
	features: {
		accounts: boolean;
		uploads: boolean;
		loans: boolean;
	};
};

export const appState = reactive<Store>({
	backendURL: localStorage.getItem('backendURL') ?? import.meta.env.VITE_BACKEND_URL ?? null,
	apiKey: localStorage.getItem('apiKey') ?? null,
	ssoURL: localStorage.getItem('ssoURL') ?? null,
	user: null,
	crashCourse: null,
	features: {accounts: false, uploads: false, loans: false},
	setUrl(url: string) {
		url = url.replace(/\/$/, '');
		this.backendURL = url;
		localStorage.setItem('backendURL', url);
		loadSettings();
	},
	setApiKey(key: string | null) {
		this.apiKey = key;
		if (key !== null) {
			localStorage.setItem('apiKey', key);
		} else {
			localStorage.removeItem('apiKey');
		}
	},
	setSSOURL(ssoURL: string | null) {
		this.ssoURL = ssoURL;
		if (ssoURL !== null) {
			localStorage.setItem('ssoURL', ssoURL);
		} else {
			localStorage.removeItem('ssoURL');
		}
	},
	setUser(user: User | null): void {
		this.user = user;
	},
	hasPermissions(permissions: PERMISSIONS[], any = false): boolean {
		if (this.user === null) {
			return false;
		} else {
			return hasPermissions(permissions, this.user.permissions, any);
		}
	}
});

export default appState;

function loadSettings() {
	Api.connection.settings().then(async (s) => {
		appState.features = s.features;

		if (!s.crashCourse.url || !s.crashCourse.key) {
			console.warn(
				'Warning, Crash Course not configured! Errors will not be sent for further analysis.',
				s.crashCourse
			);
			return;
		}

		try {
			const cc = (await import(
				/* @vite-ignore */
				`${s.crashCourse.url}/cc?k=${s.crashCourse.key}`
			)) as CrashCourse;
			if (cc) {
				appState.crashCourse = cc;
				cc.sendHit();
			}
		} catch (err) {
			console.warn(
				'Crash Course could not be loaded from',
				s.crashCourse.url + '.',
				'Errors will not be sent for further analysis.',
				err
			);
		}
	});
}

loadSettings();
