import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import {clearPopups} from './popups';
import appState from './store';
import InventoryView from '../views/InventoryView.vue';
import SettingsView from '../views/SettingsView.vue';
import UsersView from '../views/UsersView.vue';
import UserView from '../views/UserView.vue';
import ItemView from '../views/ItemView.vue';
import LabelView from '../views/LabelView.vue';
import LoansView from '../views/LoansView.vue';
import FileView from '../views/FileView.vue';

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
		path: '/items/:id',
		name: 'item',
		component: ItemView
	},
	{
		path: '/items/:id/files/:file',
		name: 'file',
		component: FileView
	},
	{
		path: '/loans',
		name: 'loans',
		component: LoansView
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
router.afterEach(() => appState.crashCourse?.sendHit());

export default router;
