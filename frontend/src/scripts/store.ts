import {reactive} from 'vue';

import type {User} from './types';
import {PERMISSIONS, hasPermissions} from '../../../common/permissions';
import Api from './api';

type CrashCourse = {
	sendLog: (message: string, level: number, tag: string | null) => Promise<true>;
	sendFeedback: (message: string) => Promise<true>;
	sendHit: () => Promise<true>;
};

type Store = {
	backendURL: string | null;
	apiKey: string | null;
	user: User | null;
	crashCourse: CrashCourse | null;
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	setUser: (user: User | null) => void;
	hasPermissions: (permissions: PERMISSIONS[]) => boolean;
};

export const appState = reactive<Store>({
	backendURL: localStorage.getItem('backendURL') ?? import.meta.env.VITE_BACKEND_URL ?? null,
	apiKey: localStorage.getItem('apiKey') ?? null,
	user: null,
	crashCourse: null,
	setUrl(url: string) {
		url = url.replace(/\/$/, '');
		this.backendURL = url;
		localStorage.setItem('backendURL', url);
		loadCrashCourse();
	},
	setApiKey(key: string) {
		this.apiKey = key;
		localStorage.setItem('apiKey', key);
	},
	setUser(user: User | null): void {
		this.user = user;
	},
	hasPermissions(permissions: PERMISSIONS[]): boolean {
		if (this.user === null) {
			return false;
		} else {
			return hasPermissions(permissions, this.user.permissions);
		}
	}
});

export default appState;

function loadCrashCourse() {
	Api.connection.settings().then(async (s) => {
		if (s.crashCourseURL === null || s.crashCourseKey === null) {
			console.warn('Crash Course not configured!', s);
			return;
		}
		const crashCourse = (await import(
			/* @vite-ignore */
			`${s.crashCourseURL}/cc?k=${s.crashCourseKey}`
		)) as CrashCourse;
		if (crashCourse) {
			appState.crashCourse = crashCourse;
			crashCourse.sendHit();
		} else {
			console.warn('Crash Course could not be loaded from', s.crashCourseURL);
		}
	});
}

loadCrashCourse();
