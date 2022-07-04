import {reactive} from 'vue';

import {User} from './api.ts';
import {PERMISSIONS, hasPermissions} from '../../../common/permissions.ts';

type Store = {
	data: {
		backendURL: string | null;
		apiKey: string | null;
		user: User | null;
	};
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	setConnectionDialogOpen: (open: boolean) => void;
	setUser: (user: User | null) => void;
	hasPermissions: (permissions: PERMISSIONS[]) => boolean;
};

export const appState = reactive({
	data: {
		backendURL: localStorage.getItem('backendURL') ?? null,
		apiKey: localStorage.getItem('apiKey') ?? null,
		user: null
	},
	setUrl(url) {
		this.data.backendURL = url;
		if (url !== null) {
			localStorage.setItem('backendURL', url);
		} else {
			localStorage.removeItem('backendURL');
		}
	},
	setApiKey(key) {
		this.data.apiKey = key;
		if (key !== null) {
			localStorage.setItem('apiKey', key);
		} else {
			localStorage.removeItem('apiKey');
		}
	},
	setConnectionDialogOpen(open: boolean) {
		this.ui.connectionDialogOpen = open;
	},
	setUser(user: User | null): void {
		this.data.user = user;
	},
	hasPermissions(permissions: PERMISSIONS[]): boolean {
		if (this.data.user === null) {
			return false;
		} else {
			return hasPermissions(permissions, this.data.user.permissions);
		}
	}
} as Store);

export default appState;
