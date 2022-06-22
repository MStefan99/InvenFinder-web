import {reactive} from 'vue';

export default reactive({
	activeTab: 'inventory',
	backendURL: localStorage.getItem('backendURL') ?? null,
	apiKey: null
});
