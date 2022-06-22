import {reactive} from 'vue';

export enum Tab {
	Inventory,
	Users,
	Settings
}

type Store = {
	activeTab: Tab;
	backendURL: string | null;
	apiKey: string | null;
	setUrl: (url: string | null) => void;
	setApiKey: (key: string | null) => void;
	openTab: (tab: Tab) => void;
};

export const appState = reactive({
	activeTab: Tab.Inventory,
	backendURL: localStorage.getItem('backendURL') ?? null,
	apiKey: localStorage.getItem('apiKey') ?? null,
	setUrl(url) {
		this.backendURL = url;
		if (url !== null) {
			localStorage.setItem('backendURL', url);
		} else {
			localStorage.removeItem('backendURL');
		}
	},
	setApiKey(key) {
		this.apiKey = key;
		if (key !== null) {
			localStorage.setItem('apiKey', key);
		} else {
			localStorage.removeItem('apiKey');
		}
	},
	openTab(tab) {
		this.activeTab = tab;
	}
} as Store);

export default appState;
