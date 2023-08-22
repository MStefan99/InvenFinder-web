'use strict';

import {createApp} from 'vue';
import App from './App.vue';
import router from './scripts/routes';
import './assets/style.css';
import appState from './scripts/store';

const app = createApp(App);

app.config.errorHandler = (err: unknown) => {
	console.error('Vue error', err);
	appState.crashCourse?.sendLog(String(err), 3);
};

app.config.warnHandler = (err: unknown) => {
	console.warn('Vue error', err);
	appState.crashCourse?.sendLog(String(err), 2);
};

(() => {
	app.use(router).mount('#app');
}).call({});
