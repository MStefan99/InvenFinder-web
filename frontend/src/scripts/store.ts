import {reactive} from 'vue';

export enum Tab {
	Inventory,
	Users,
	Settings
}

type Store = {
	data: {
		backendURL: string | null;
		apiKey: string | null;
	};
	ui: {
		activeTab: Tab;
		connectionDialogOpen: boolean;
	};
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	openTab: (tab: Tab) => void;
	setConnectionDialogOpen: (open: boolean) => void;
};

export const appState = reactive({
	data: {
		backendURL: localStorage.getItem('backendURL') ?? null,
		apiKey: localStorage.getItem('apiKey') ?? null
	},
	ui: {
		activeTab: Tab.Inventory,
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
	openTab(tab) {
		this.ui.activeTab = tab;
	},
	setConnectionDialogOpen(open: boolean) {
		this.ui.connectionDialogOpen = open;
	}
} as Store);

export default appState;
