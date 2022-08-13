import {reactive, ref} from 'vue';

enum AlertType {
	Info,
	Notice,
	Warning
}

type Alert = {
	id: number;
	title: string;
	details?: string;
	type: AlertType;
};

type Confirm = {
	title: string;
	details?: string;
};

let lastID = 0;

export const activeAlerts = reactive<Alert[]>([]);
export const activeConfirm = ref<{
	confirm: Confirm;
	resolve: (boolean) => void;
} | null>(null);

export function alert(title: string, type: AlertType, details?: string): Promise<void> {
	return new Promise<void>((resolve) => {
		const id = ++lastID;

		setTimeout(() => {
			activeAlerts.splice(
				activeAlerts.findIndex((n) => n.id === id),
				1
			);
			resolve();
		}, 1000);

		const alert = {id, title, details, type} as Alert;

		activeAlerts.push(alert);
	});
}

export function confirm(title: string, details?: string): Promise<boolean> {
	return new Promise<boolean>(
		(resolve) => (activeConfirm.value = {confirm: {title, details}, resolve})
	);
}

export function prompt() {
	null;
}

alert('Title', AlertType.Info, 'details');
confirm('Title', 'details').then((res) => console.log('confirm', res));
