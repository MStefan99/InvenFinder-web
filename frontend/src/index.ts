'use strict';

import {createApp} from 'vue';
import App from './App.vue';
import router from './scripts/routes';
import './assets/style.css';

(() => {
	createApp(App).use(router).mount('#app');
}).call({});
