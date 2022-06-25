import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import InventoryView from '../views/InventoryView.vue';
import SettingsView from '../views/SettingsView.vue';
import UsersView from '../views/UsersView.vue';

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		redirect: {
			name: 'inventory'
		}
	},
	{
		path: '/inventory',
		name: 'inventory',
		component: InventoryView
	},
	{
		path: '/users',
		name: 'users',
		component: UsersView
	},
	{
		path: '/settings',
		name: 'settings',
		component: SettingsView
	}
];

const router = createRouter({
	history: createWebHistory('/'),
	routes
});

export default router;