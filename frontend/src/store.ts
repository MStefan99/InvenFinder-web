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
	setUrl: (url: string) => void;
	setApiKey: (key: string) => void;
	openTab: (tab: Tab) => void;
};

export const appState = reactive({
	activeTab: Tab.Inventory,
	backendURL: localStorage.getItem('backendURL') ?? null,
	apiKey: localStorage.getItem('apiKey') ?? null,
	setUrl(url) {
		this.backendURL = url;
		localStorage.setItem('backendURL', url);
	},
	setApiKey(key) {
		this.apiKey = key;
		localStorage.setItem('apiKey', key);
	},
	openTab(tab) {
		this.activeTab = tab;
	}
} as Store);

export default appState;
