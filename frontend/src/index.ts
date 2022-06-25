'use strict';

import {createApp} from 'vue';
import App from './App.vue';
import router from './scripts/routes';
import './assets/index.css';

(() => {
	createApp(App).use(router).mount('#app');
}).call({});
