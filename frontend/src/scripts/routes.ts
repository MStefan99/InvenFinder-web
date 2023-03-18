import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import InventoryView from '../views/InventoryView.vue';
import SettingsView from '../views/SettingsView.vue';
import UsersView from '../views/UsersView.vue';
import UserView from '../views/UserView.vue';
import ItemView from '../views/ItemView.vue';
import LabelView from '../views/LabelView.vue';
import {clearPopups} from './popups';

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
		path: '/users/:id',
		name: 'user',
		component: UserView
	},
	{
		path: '/settings',
		name: 'settings',
		component: SettingsView
	},
	{
		path: '/items/:id',
		name: 'item',
		component: ItemView
	},
	{
		path: '/labels',
		name: 'labels',
		component: LabelView
	}
];

const router = createRouter({
	history: createWebHistory('/'),
	routes
});

router.beforeEach(() => clearPopups());

(async () => {
	if (import.meta.env.VITE_CRASH_COURSE_URL) {
		const {sendHit} = await import(
			/* @vite-ignore */
			`${import.meta.env.VITE_CRASH_COURSE_URL}/cc?k=${import.meta.env.VITE_CRASH_COURSE_KEY}`
		);
		if (sendHit) {
			sendHit();
			router.afterEach(sendHit);
		}
	}
})();

export default router;
