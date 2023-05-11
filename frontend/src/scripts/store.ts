import {reactive} from 'vue';

import type {User} from './types';
import {PERMISSIONS, hasPermissions} from '../../../common/permissions';
import Api from './api';

type CrashCourse = {
	sendLog: (message: string, level: number, tag: string | null) => Promise<true>;
	sendFeedback: (message: string) => Promise<true>;
	sendHit: () => Promise<true>;
};

export const appState = reactive({
	backendURL: localStorage.getItem('backendURL') ?? import.meta.env.VITE_BACKEND_URL ?? null,
	apiKey: localStorage.getItem('apiKey') ?? null,
	user: null,
	crashCourse: null,
	features: {accounts: false, uploads: false},
	setUrl(url: string) {
		url = url.replace(/\/$/, '');
		this.backendURL = url;
		localStorage.setItem('backendURL', url);
		loadSettings();
	},
	setApiKey(key: string) {
		this.apiKey = key;
		localStorage.setItem('apiKey', key);
	},
	setUser(user: User | null): void {
		this.user = user;
	},
	hasPermissions(permissions: PERMISSIONS[], any = false): boolean {
		if (this.user === null) {
			return false;
		} else {
			console.log(
				permissions,
				this.user.permissions,
				any,
				hasPermissions(permissions, this.user.permissions, any)
			);
			return hasPermissions(permissions, this.user.permissions, any);
		}
	}
});

export default appState;

function loadSettings() {
	Api.connection.settings().then(async (s) => {
		appState.features = s.features;

		if (s.crashCourse.url === null || s.crashCourse.key === null) {
			console.warn(
				'Warning, Crash Course not configured! Errors will not be sent for further analysis.',
				s.crashCourse
			);
			return;
		}
		const crashCourse = (await import(
			/* @vite-ignore */
			`${s.crashCourse.url}/cc?k=${s.crashCourse.key}`
		)) as CrashCourse;
		if (crashCourse) {
			appState.crashCourse = crashCourse;
			crashCourse.sendHit();
		} else {
			console.warn('Crash Course could not be loaded from', s.crashCourse.url);
		}
	});
}

loadSettings();
