import {reactive} from 'vue';

type Store = {
	data: {
		backendURL: string | null;
		apiKey: string | null;
	};
	ui: {
		connectionDialogOpen: boolean;
	};
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	setConnectionDialogOpen: (open: boolean) => void;
};

export const appState = reactive({
	data: {
		backendURL: localStorage.getItem('backendURL') ?? null,
		apiKey: localStorage.getItem('apiKey') ?? null
	},
	ui: {
		connectionDialogOpen: false
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
	}
} as Store);

export default appState;
