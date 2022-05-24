import {reactive} from 'vue';


export default reactive({
	activeTab: 'inventory',
	backendURL: 'http://192.168.1.11:3007'  // TODO: replace with something more sensible (localhost?)
});
